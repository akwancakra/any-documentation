import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_LOG_MAX_ENTRIES, fileActivityRowToEntry } from "@/lib/activity-log-store";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.fileActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_LOG_MAX_ENTRIES,
    });
    const logs = rows.map(fileActivityRowToEntry);
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
