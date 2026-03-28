import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// npm run db:seed tidak selalu memuat .env; samakan dengan Next.
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function upsertUser(params: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  resetPassword: boolean;
}) {
  const email = params.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(params.password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: params.name,
      role: params.role,
    },
    update: {
      name: params.name,
      role: params.role,
      ...(params.resetPassword ? { passwordHash } : {}),
    },
  });

  return { user, passwordReset: params.resetPassword };
}

async function main() {
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD?.trim() || "password123";
  const userPassword = process.env.SEED_USER_PASSWORD?.trim() || "password123";

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com")
    .trim()
    .toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME || "Administrator";
  const resetAdmin = process.env.SEED_RESET_ADMIN_PASSWORD === "true";

  const userEmail = (process.env.SEED_USER_EMAIL || "user@example.com")
    .trim()
    .toLowerCase();
  const userName = process.env.SEED_USER_NAME || "Demo User";
  const resetUser = process.env.SEED_RESET_USER_PASSWORD === "true";

  if (adminEmail === userEmail) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_USER_EMAIL must be different addresses.",
    );
  }

  const hadAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });
  const hadUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  const adminResult = await upsertUser({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: "admin",
    resetPassword: resetAdmin,
  });

  const userResult = await upsertUser({
    email: userEmail,
    password: userPassword,
    name: userName,
    role: "user",
    resetPassword: resetUser,
  });

  console.log("Seed OK — admin:", {
    id: adminResult.user.id,
    email: adminResult.user.email,
    role: adminResult.user.role,
    passwordFrom: process.env.SEED_ADMIN_PASSWORD
      ? "SEED_ADMIN_PASSWORD"
      : "default password123",
    passwordNote: adminResult.passwordReset
      ? "Hash updated (SEED_RESET_ADMIN_PASSWORD=true)"
      : "Hash kept; set SEED_RESET_ADMIN_PASSWORD=true to apply new SEED_ADMIN_PASSWORD",
  });

  console.log("Seed OK — user:", {
    id: userResult.user.id,
    email: userResult.user.email,
    role: userResult.user.role,
    passwordFrom: process.env.SEED_USER_PASSWORD
      ? "SEED_USER_PASSWORD"
      : "default password123",
    passwordNote: userResult.passwordReset
      ? "Hash updated (SEED_RESET_USER_PASSWORD=true)"
      : "Hash kept; set SEED_RESET_USER_PASSWORD=true to apply new SEED_USER_PASSWORD",
  });

  if (hadAdmin && !resetAdmin) {
    console.warn(
      "\n[seed] Admin sudah ada di DB — password_hash tidak diubah. " +
        "Kalau login 401 padahal yakin password benar, set SEED_RESET_ADMIN_PASSWORD=true lalu jalankan npm run db:seed lagi.\n",
    );
  }
  if (hadUser && !resetUser) {
    console.warn(
      "[seed] User demo sudah ada — password_hash tidak diubah. " +
        "Sama seperti admin: pakai SEED_RESET_USER_PASSWORD=true untuk memakai SEED_USER_PASSWORD yang baru.\n",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
