"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchContext } from "fumadocs-ui/provider";
import { Button } from "@/components/ui/button";
import { HeroGridBackdrop } from "@/components/shell/hero-grid-backdrop";
import { SiteLogo } from "@/components/shell/site-logo";
import { ThemeSwitcher } from "./theme-switcher";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";

export function HomeHero() {
  const reduceMotion = useReducedMotion();
  const { setOpenSearch, enabled: searchEnabled } = useSearchContext();
  const { data: session, status } = useSession();
  const isAdmin = session && checkIsAdmin(session);
  const userName = session?.user?.name || session?.user?.email || "";

  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.5, delay },
  });

  const fadeUpLarge = (delay = 0) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.6, delay },
  });

  return (
    <section className="relative overflow-hidden bg-background pb-8 md:pb-12">
      <div
        className="absolute inset-0 pointer-events-none bg-[length:48px_48px]"
        style={{
          backgroundImage: "var(--hero-grid)",
          WebkitMaskImage: "var(--hero-grid-mask)",
          maskImage: "var(--hero-grid-mask)",
        }}
        aria-hidden
      />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-6 md:gap-8 min-w-0">
          <Link
            href="/"
            className="text-foreground font-bold text-xl tracking-tight flex items-center gap-2 shrink-0"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-foreground text-background font-black text-sm">
              W
            </span>
            <span className="truncate">Wiki Docs</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/docs"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <ThemeSwitcher />
          {status === "authenticated" ? (
            <>
              <span className="text-xs text-muted-foreground max-w-[100px] truncate hidden lg:inline">
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
      </nav>

      <div className="relative z-10 flex flex-col items-center pt-8 text-center md:pt-14 ds-page-shell">
        <motion.div {...fadeUp(0)}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground mb-8">
            <span>Open source • Build your docs with MDX</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-medium tracking-tight text-foreground max-w-4xl leading-[1.1]"
          {...fadeUpLarge(0.1)}
        >
          <span className="text-muted-foreground">Find</span> what you need
        </motion.h1>

        <motion.p
          className="mt-6 text-muted-foreground text-base md:text-lg max-w-2xl"
          {...fadeUp(0.25)}
        >
          Search across all pages, then jump into the latest updates below.
        </motion.p>

        <motion.div
          className="mt-10 flex w-full max-w-3xl flex-col flex-wrap items-center justify-center gap-4 sm:flex-row"
          {...fadeUp(0.4)}
        >
          <Button asChild size="lg" variant="pill" className="gap-2">
            <Link href="/docs">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="pillOutline"
            className="gap-2"
            disabled={!searchEnabled}
            onClick={() => setOpenSearch(true)}
          >
            <Search className="h-4 w-4" aria-hidden />
            Search docs
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
