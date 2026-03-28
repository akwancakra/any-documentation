"use client";

import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/shell/site-logo";
import { useSession } from "next-auth/react";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAdmin = session && checkIsAdmin(session);
  const userName = session?.user?.name || session?.user?.email || "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 ds-page-shell">
        <div className="flex min-w-0 items-center gap-6 md:gap-8">
          <SiteLogo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <ThemeSwitcher />
          {status === "authenticated" ? (
            <>
              <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground lg:inline">
                {userName}
              </span>
              <Button asChild variant="outline" size="sm">
                <Link href="/api/auth/signout">Logout</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
