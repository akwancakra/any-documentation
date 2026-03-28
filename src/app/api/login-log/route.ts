import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import type { LoginLogData } from "@/lib/login-log-types";

function getLoginLogSecret() {
  return (
    process.env.LOGIN_LOG_INTERNAL_SECRET || process.env.NEXTAUTH_SECRET || ""
  );
}

type LoginLogRow = {
  event: string;
  success: boolean;
  provider: string;
  sessionId: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  requestInfo: Prisma.JsonValue;
};

function rowToLoginLogData(row: LoginLogRow): LoginLogData {
  const requestInfo = row.requestInfo as LoginLogData["requestInfo"];
  return {
    event: row.event,
    success: row.success,
    user: {
      id: row.userId ?? undefined,
      email: row.userEmail ?? undefined,
      name: row.userName ?? undefined,
      role: row.userRole ?? undefined,
    },
    provider: row.provider,
    requestInfo,
    sessionId: row.sessionId,
  };
}

// POST — persist login log (internal X-Internal-Token only)
export async function POST(req: NextRequest) {
  try {
    const expected = getLoginLogSecret();
    const token = req.headers.get("x-internal-token");
    if (!expected || token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logData: LoginLogData = await req.json();

    if (!logData.event || !logData.user || !logData.provider) {
      return NextResponse.json(
        { error: "Incomplete log payload" },
        { status: 400 }
      );
    }

    if (!logData.requestInfo) {
      logData.requestInfo = {
        ip: "unknown",
        userAgent: "unknown",
        browser: "unknown",
        os: "unknown",
        device: "unknown",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        timestamp: new Date().toISOString(),
        headers: {},
      };
    }

    if (!logData.sessionId) {
      return NextResponse.json(
        { error: "Incomplete log payload" },
        { status: 400 }
      );
    }

    if (!logData.requestInfo.timestamp) {
      logData.requestInfo.timestamp = new Date().toISOString();
    }

    const ts = new Date(logData.requestInfo.timestamp);
    const createdAt = Number.isNaN(ts.getTime()) ? new Date() : ts;

    await prisma.loginLog.create({
      data: {
        event: logData.event,
        success: logData.success,
        provider: logData.provider,
        sessionId: logData.sessionId,
        userId: logData.user?.id ?? null,
        userEmail: logData.user?.email ?? null,
        userName: logData.user?.name ?? null,
        userRole: logData.user?.role ?? null,
        requestInfo: logData.requestInfo as Prisma.InputJsonValue,
        createdAt,
      },
    });

    return NextResponse.json(
      { message: "Log saved successfully", logId: logData.sessionId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving login log:", error);
    return NextResponse.json(
      { error: "Failed to save log" },
      { status: 500 }
    );
  }
}

// GET — list login logs (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const rawPage = parseInt(url.searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(url.searchParams.get("limit") || "50", 10);
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 5000)
        : 50;
    const success = url.searchParams.get("success");
    const provider = url.searchParams.get("provider");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const where: Prisma.LoginLogWhereInput = {};
    if (success !== null && success !== "") {
      where.success = success === "true";
    }
    if (provider) {
      where.provider = provider;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [total, rows] = await prisma.$transaction([
      prisma.loginLog.count({ where }),
      prisma.loginLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      logs: rows.map(rowToLoginLogData),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
      filters: {
        success,
        provider,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching login logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// DELETE — remove logs older than N days (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await prisma.loginLog.deleteMany({
      where: { createdAt: { lte: cutoffDate } },
    });

    const remainingCount = await prisma.loginLog.count();

    return NextResponse.json({
      message: `Removed ${deleted.count} old log entries`,
      deletedCount: deleted.count,
      remainingCount,
    });
  } catch (error) {
    console.error("Error cleaning up logs:", error);
    return NextResponse.json(
      { error: "Failed to clean up logs" },
      { status: 500 }
    );
  }
}
