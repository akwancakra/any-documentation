"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSearchContext } from "fumadocs-ui/provider";
import { Button } from "@/components/ui/button";

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable || !!el.closest("[contenteditable='true']");
}

export function SearchDocsButton() {
  const { setOpenSearch, enabled: searchEnabled } = useSearchContext();
  const [searchKeyHint, setSearchKeyHint] = useState<string | null>(null);

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
  );
}
