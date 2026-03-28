"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLoginLogs, useLoginLogStats } from "@/hooks/use-login-logs";
import {
  formatLoginTime,
  getDeviceIcon,
  getBrowserIcon,
  getOSIcon,
} from "@/lib/login-log-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Filter,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";

export default function LoginLogsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const {
    logs,
    loading,
    error,
    filters,
    pagination,
    hasAdminAccess,
    updateFilters,
    changePage,
    refresh,
    clearFilters,
  } = useLoginLogs();

  const { stats } = useLoginLogStats();

  // Redirect if not admin
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    router.push("/dashboard");
    return null;
  }

  const handleDateRangeChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    updateFilters({ [field]: value });
  };

  const handleFilterChange = (field: string, value: any) => {
    updateFilters({ [field]: value === "all" ? null : value });
  };

  return (
    <div className="max-w-6xl space-y-8 py-8 ds-page-shell">
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">
            Login logs
          </h1>
          <p className="mt-2 text-muted-foreground">
            Monitor and analyze user sign-in activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                Total logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {stats.totalLogins}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.uniqueUsers} unique users
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                Successful logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {stats.successfulLogins}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.successRate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <XCircle className="mr-2 h-4 w-4 text-destructive" />
                Failed logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-destructive">
                {stats.failedLogins}
              </div>
              <p className="text-xs text-muted-foreground">
                Review if this number is high
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                Browser teratas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold tracking-tight">
                {stats.topBrowsers[0]?.browser || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.topBrowsers[0]?.count || 0} hits
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium tracking-tight">
              Filter logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={
                    filters.success === null
                      ? "all"
                      : filters.success?.toString()
                  }
                  onValueChange={(value) =>
                    handleFilterChange("success", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="true">Success</SelectItem>
                    <SelectItem value="false">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Provider
                </label>
                <Select
                  value={filters.provider || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("provider", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    <SelectItem value="credentials">Credentials (database)</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Start date
                </label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleDateRangeChange("startDate", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  End date
                </label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleDateRangeChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="rounded-2xl border border-destructive/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card className="rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-medium tracking-tight">
                Login activity
              </CardTitle>
              <CardDescription>
                Showing {logs.length} of {pagination.total} logs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading…</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No login logs yet
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.sessionId}
                  className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-sm transition-colors hover:bg-card/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.success ? "default" : "destructive"}
                        >
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                        <Badge variant="outline">{log.provider}</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatLoginTime(log.requestInfo.timestamp)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">User:</span>
                      <div className="text-muted-foreground">
                        {log.user.name || log.user.email}
                        {log.user.role && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {log.user.role}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Provider: {log.provider}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">IP Address:</span>
                      <div className="text-muted-foreground font-mono">
                        {log.requestInfo.ip}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Device:</span>
                      <div className="text-muted-foreground">
                        {getDeviceIcon(log.requestInfo.device)}{" "}
                        {log.requestInfo.device}
                        {log.requestInfo.isMobile && " (Mobile)"}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Browser & OS:</span>
                      <div className="text-muted-foreground">
                        {getBrowserIcon(log.requestInfo.browser)}{" "}
                        {log.requestInfo.browser} on{" "}
                        {getOSIcon(log.requestInfo.os)} {log.requestInfo.os}
                      </div>
                    </div>
                  </div>

                  {log.requestInfo.userAgent && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium cursor-pointer">
                        User Agent
                      </summary>
                      <div className="mt-2 rounded-lg bg-muted/80 p-2 font-mono text-xs text-muted-foreground">
                        {log.requestInfo.userAgent}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
