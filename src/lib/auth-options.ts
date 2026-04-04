import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/auth-utils";

function extractRequestInfo(req: unknown) {
  let forwarded: string | null = null;
  let realIp: string | null = null;
  let userAgent: string | null = null;
  let host: string | null = null;
  let referer: string | null = null;
  try {
    const r = req as {
      headers?: { get?: (k: string) => string | null } & Record<string, string>;
    };
    if (r?.headers && typeof r.headers.get === "function") {
      forwarded = r.headers.get("x-forwarded-for");
      realIp = r.headers.get("x-real-ip");
      userAgent = r.headers.get("user-agent");
      host = r.headers.get("host");
      referer = r.headers.get("referer");
    } else if (r?.headers && typeof r.headers === "object") {
      forwarded = r.headers["x-forwarded-for"] || null;
      realIp = r.headers["x-real-ip"] || null;
      userAgent = r.headers["user-agent"] || null;
      host = r.headers["host"] || null;
      referer = r.headers["referer"] || null;
    }
  } catch (error) {
    console.warn("Error extracting request info:", error);
  }
  const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";
  const deviceInfo = parseUserAgent(userAgent || "unknown");
  return {
    ip,
    userAgent: userAgent || "unknown",
    ...deviceInfo,
    timestamp: new Date().toISOString(),
    headers: {
      forwarded,
      realIp,
      host,
      referer,
    },
  };
}

function parseUserAgent(userAgent: string) {
  const info = {
    browser: "unknown",
    os: "unknown",
    device: "unknown",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  };
  if (userAgent.includes("Chrome")) info.browser = "Chrome";
  else if (userAgent.includes("Firefox")) info.browser = "Firefox";
  else if (userAgent.includes("Safari")) info.browser = "Safari";
  else if (userAgent.includes("Edge")) info.browser = "Edge";
  else if (userAgent.includes("Opera")) info.browser = "Opera";
  if (userAgent.includes("Windows")) info.os = "Windows";
  else if (userAgent.includes("Mac")) info.os = "macOS";
  else if (userAgent.includes("Linux")) info.os = "Linux";
  else if (userAgent.includes("Android")) info.os = "Android";
  else if (userAgent.includes("iOS")) info.os = "iOS";
  if (userAgent.includes("Mobile")) {
    info.isMobile = true;
    info.isDesktop = false;
    info.device = "Mobile";
  } else if (userAgent.includes("Tablet")) {
    info.isTablet = true;
    info.isDesktop = false;
    info.device = "Tablet";
  } else {
    info.device = "Desktop";
  }
  return info;
}

async function logUserLogin(
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  },
  requestInfo: ReturnType<typeof extractRequestInfo>,
  provider: string,
  success: boolean = true
) {
  try {
    await prisma.loginLog.create({
      data: {
        createdAt: new Date(),
        event: "user_login",
        success,
        provider,
        sessionId: generateSessionId(),
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        userRole: user?.role,
        requestInfo: requestInfo as object,
      },
    });
  } catch (error) {
    console.warn("Failed to write login log:", error);
  }
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function normalizeRole(role: string | null | undefined): UserRole {
  return role === "admin" ? "admin" : "user";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const rawPassword = credentials?.password ?? "";
        const password = rawPassword.trim();
        if (!credentials?.email || !password) {
          return null;
        }

        if (!process.env.DATABASE_URL) {
          console.error("DATABASE_URL is not set; cannot authenticate");
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const requestInfo = extractRequestInfo(req);

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!dbUser) {
            await logUserLogin(
              { email },
              requestInfo,
              "credentials",
              false
            );
            return null;
          }

          const hash = dbUser.passwordHash;
          if (!/^\$2[aby]\$\d{2}\$/.test(hash)) {
            console.error(
              "password_hash di DB bukan bcrypt; jalankan seed dengan SEED_RESET_*_PASSWORD=true atau perbaiki data user.",
            );
            await logUserLogin(
              { id: dbUser.id, email: dbUser.email },
              requestInfo,
              "credentials",
              false
            );
            return null;
          }

          const ok = await bcrypt.compare(password, hash);
          if (!ok) {
            await logUserLogin(
              { id: dbUser.id, email: dbUser.email },
              requestInfo,
              "credentials",
              false
            );
            return null;
          }

          const role = normalizeRole(dbUser.role);
          const user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || dbUser.email,
            role,
          };

          try {
            await logUserLogin(user, requestInfo, "credentials", true);
          } catch (logErr) {
            console.error("Login log failed (session tetap dibuat):", logErr);
          }
          return user;
        } catch (error) {
          console.error("Authentication error:", error);
          await logUserLogin(
            { email },
            extractRequestInfo(req),
            "error",
            false
          );
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "credentials") {
        return !!user;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role ?? "user";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as UserRole) ?? "user";
        if (token.id) {
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
