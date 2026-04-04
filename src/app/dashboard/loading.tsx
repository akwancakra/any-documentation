import { Shield } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Shield className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    </div>
  );
}
