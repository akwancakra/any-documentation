import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  /** Custom message to display. Defaults to generic admin-only message. */
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function AccessDenied({
  message = "This page is only available to administrators.",
  backHref = "/",
  backLabel = "Back to home",
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-2xl font-medium tracking-tight text-foreground">
          Access denied
        </h2>
        <p className="text-muted-foreground">{message}</p>
        <Button asChild className="mt-6 rounded-full px-6">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
