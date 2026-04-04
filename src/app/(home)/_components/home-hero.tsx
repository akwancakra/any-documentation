"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useSearchContext } from "fumadocs-ui/provider";
import { Button } from "@/components/ui/button";
import { Navbar } from "./navbar";

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable || !!el.closest("[contenteditable='true']");
}

export function HomeHero() {
  const reduceMotion = useReducedMotion();
  const { setOpenSearch, enabled: searchEnabled } = useSearchContext();
  const [searchKeyHint, setSearchKeyHint] = useState<string | null>(null);

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

  useEffect(() => {
    setSearchKeyHint(
      /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent) ? "⌘K" : "Ctrl+K",
    );
  }, []);

  useEffect(() => {
    if (!searchEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "k") return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setOpenSearch(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchEnabled, setOpenSearch]);

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

      <div className="relative z-10">
        <Navbar />
      </div>

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
            aria-keyshortcuts="Control+K Meta+K"
            onClick={() => setOpenSearch(true)}
          >
            <Search className="h-4 w-4" aria-hidden />
            Search docs
            {searchKeyHint ? (
              <kbd className="ml-2 hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground tabular-nums">
                {searchKeyHint}
              </kbd>
            ) : null}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
