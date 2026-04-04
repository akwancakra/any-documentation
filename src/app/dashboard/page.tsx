"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, Suspense } from "react";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import type { ActivityLogEntry } from "@/lib/activity-log-store";
import { formatActivityLogTime } from "@/lib/formatters";
import {
  Shield,
  FileText,
  Users,
  Edit3,
  AlertTriangle,
  ChevronRight,
  Activity,
  ArrowLeft,
} from "lucide-react";

function activityBadgeLabel(type: ActivityLogEntry["type"] | string): string {
  switch (type) {
    case "create":
      return "Create";
    case "update":
      return "Update";
    case "delete":
      return "Delete";
    case "folder_create":
      return "Folder";
    case "move":
      return "Move";
    case "rename":
      return "Rename";
    default:
      return String(type || "Activity");
  }
}

function truncateDetail(s: string, max = 64): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function activityLogDescription(log: ActivityLogEntry): string {
  switch (log.type) {
    case "create":
    case "update":
      return truncateDetail(log.file);
    case "delete": {
      const suffix = log.isDirectory ? " (folder)" : "";
      return truncateDetail(`${log.file}${suffix}`);
    }
    case "folder_create":
      return truncateDetail(log.path);
    case "move":
    case "rename":
      return truncateDetail(`${log.from} → ${log.to}`, 80);
    default:
      return "";
  }
}

function activityLogRowKey(log: ActivityLogEntry, index: number): string {
  const pathKey =
    log.type === "move" || log.type === "rename"
      ? `${log.from}|${log.to}`
      : log.type === "folder_create"
        ? log.path
        : log.type === "delete"
          ? `${log.file}|${log.isDirectory ? "d" : "f"}`
          : log.file;
  return `${log.time}|${log.type}|${pathKey}|${log.user}|${index}`;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const error = searchParams.get("error");

  // All hooks must run unconditionally here
  const [totalDocs, setTotalDocs] = useState<number | null>(null);
  const [totalSizeMB, setTotalSizeMB] = useState<number | null>(null);
  const [updatedThisMonth, setUpdatedThisMonth] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    if (error === "unauthorized" || error === "access-denied") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access that page",
        variant: "destructive",
      });
      router.replace("/dashboard");
    }
  }, [error, toast, router]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetch("/api/docs/count", { signal })
      .then((res) => res.json())
      .then((data) => {
        setTotalDocs(data.total);
        setTotalSizeMB(data.totalSizeMB);
        setUpdatedThisMonth(data.updatedThisMonth);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setTotalDocs(null);
        setTotalSizeMB(null);
        setUpdatedThisMonth(null);
      });

    fetch("/api/activity-log", { signal })
      .then((res) => res.json())
      .then((data) =>
        setRecentActivity(
          Array.isArray(data.logs) ? (data.logs as ActivityLogEntry[]) : [],
        ),
      )
      .catch((err) => {
        if (err.name === "AbortError") return;
        setRecentActivity([]);
      });

    return () => controller.abort();
  }, []);

  // Conditional returns only after all hooks
  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const isAdmin = checkIsAdmin(session);
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-2xl font-medium tracking-tight text-foreground">
            Access denied
          </h2>
          <p className="text-muted-foreground">
            The dashboard is only available to administrators.
          </p>
          <Button
            className="mt-6 rounded-full px-6"
            onClick={() => router.push("/")}
          >
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "All Documentation",
      description: "All documentation in the system",
      icon: FileText,
      href: "/docs",
      available: true,
    },
    {
      title: "Documentation Editor",
      description: "Create and edit documentation",
      icon: Edit3,
      href: "/editor/create",
      available: isAdmin,
      adminOnly: true,
    },
    {
      title: "Login Logs",
      description: "Monitor user login activities",
      icon: Activity,
      href: "/dashboard/login-logs",
      available: isAdmin,
      adminOnly: true,
    },
  ];

  return (
    <div className="max-w-6xl py-8 ds-page-shell">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              Documentation dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Welcome,{" "}
              <span className="font-medium text-foreground">
                {session.user?.name}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Administrator" : "User"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards - Only for Admin */}
      {isAdmin && (
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {totalDocs === null ? "…" : totalDocs}
              </div>
              <p className="text-xs text-muted-foreground">
                Number of documents in the system
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Size (MB)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {totalSizeMB === null ? "…" : totalSizeMB}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined size of all .mdx documents
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Updated This Month
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {updatedThisMonth === null ? "…" : updatedThisMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                .mdx documents updated this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-medium tracking-tight text-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions
            .filter((action) => action.available)
            .map((action) => (
              <Card
                key={action.href}
                className="group cursor-pointer rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md"
                onClick={() => router.push(action.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-lg border border-border bg-secondary p-2">
                        <action.icon className="h-5 w-5 text-foreground" />
                      </span>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base font-medium tracking-tight">
                          {action.title}
                          {action.adminOnly && (
                            <Badge variant="outline" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-xl font-medium tracking-tight text-foreground">
          Recent activity
        </h2>
        <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm">
          <CardContent className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentActivity.slice(0, 10).map((log, index) => (
                  <li
                    key={activityLogRowKey(log, index)}
                    className="flex flex-wrap items-center gap-2 text-sm sm:flex-nowrap"
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatActivityLogTime(log.time)}
                    </span>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs font-medium"
                    >
                      {activityBadgeLabel(log.type)}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {activityLogDescription(log)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
      <DashboardContent />
    </Suspense>
  );
}
