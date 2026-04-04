"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
import type { ActivityLogEntry } from "@/lib/activity-log-store";
import { formatActivityLogTime } from "@/lib/formatters";
import {
  FileText,
  Edit3,
  Activity,
  ChevronRight,
} from "lucide-react";

function activityBadgeLabel(type: ActivityLogEntry["type"] | string): string {
  switch (type) {
    case "create": return "Create";
    case "update": return "Update";
    case "delete": return "Delete";
    case "folder_create": return "Folder";
    case "move": return "Move";
    case "rename": return "Rename";
    default: return String(type || "Activity");
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

interface DashboardStats {
  total: number;
  totalSizeMB: number;
  updatedThisMonth: number;
}

interface DashboardViewProps {
  userName: string;
  isAdmin: boolean;
  stats: DashboardStats;
  recentActivity: ActivityLogEntry[];
}

export function DashboardView({
  userName,
  isAdmin,
  stats,
  recentActivity,
}: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const error = searchParams.get("error");

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
              <span className="font-medium text-foreground">{userName}</span>
            </p>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? "Administrator" : "User"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      {isAdmin && (
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {[
            {
              label: "Total Documents",
              value: stats.total,
              description: "Number of documents in the system",
              icon: FileText,
            },
            {
              label: "Total Size (MB)",
              value: stats.totalSizeMB,
              description: "Combined size of all .mdx documents",
              icon: FileText,
            },
            {
              label: "Updated This Month",
              value: stats.updatedThisMonth,
              description: ".mdx documents updated this month",
              icon: Activity,
            },
          ].map(({ label, value, description, icon: Icon }) => (
            <Card
              key={label}
              className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-card/80 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-medium tracking-tight text-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions
            .filter((a) => a.available)
            .map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <Card className="h-full cursor-pointer rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-card/80 hover:shadow-md">
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
              </Link>
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
                    <Badge variant="secondary" className="shrink-0 text-xs font-medium">
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
