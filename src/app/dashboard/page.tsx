import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getDocsStorage } from "@/lib/docs-storage";
import { scanMDXRelKeys } from "@/lib/mdx-utils";
import {
  ACTIVITY_LOG_MAX_ENTRIES,
  fileActivityRowToEntry,
} from "@/lib/activity-log-store";
import { AccessDenied } from "@/components/shell/access-denied";
import { DashboardView } from "./_components/dashboard-view";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Dashboard | Any Documentation",
};

async function getDashboardStats() {
  let total = 0;
  let totalSizeMB = 0;
  let updatedThisMonth = 0;

  try {
    const storage = getDocsStorage();
    const keys = await scanMDXRelKeys();
    total = keys.length;
    const now = new Date();
    const thisMonth = now.getUTCMonth();
    const thisYear = now.getUTCFullYear();

    for (const key of keys) {
      const head = await storage.head(key);
      if (!head) continue;
      const mtime = head.lastModified;
      if (mtime.getUTCMonth() === thisMonth && mtime.getUTCFullYear() === thisYear) {
        updatedThisMonth++;
      }
      totalSizeMB += head.size;
    }
    totalSizeMB = +(totalSizeMB / (1024 * 1024)).toFixed(2);
  } catch {
    /* return defaults */
  }

  return { total, totalSizeMB, updatedThisMonth };
}

async function getRecentActivity() {
  try {
    const rows = await prisma.fileActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_LOG_MAX_ENTRIES,
    });
    return rows.map(fileActivityRowToEntry);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = checkIsAdmin(session);
  if (!isAdmin) {
    return (
      <AccessDenied message="The dashboard is only available to administrators." />
    );
  }

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </div>
      }
    >
      <DashboardView
        userName={session.user?.name || session.user?.email || ""}
        isAdmin={isAdmin}
        stats={stats}
        recentActivity={recentActivity}
      />
    </Suspense>
  );
}
