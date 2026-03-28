"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { highlightSearchTerms } from "@/lib/search-highlight";

interface SearchResult {
  id: string;
  type: "page" | "text";
  content: string;
  url: string;
  title?: string;
  description?: string;
  excerpt?: string;
}

interface DisplayDoc {
  title: string;
  description: string;
  href: string;
  type: "page" | "text";
  snippet?: string;
}

function extractSnippet(
  content: string,
  query: string,
  maxLength: number = 150
): string {
  if (!content || !query) return content.substring(0, maxLength) + "...";

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
  const contentLower = content.toLowerCase();

  let bestMatch = -1;

  for (const term of searchTerms) {
    const index = contentLower.indexOf(term);
    if (index !== -1 && (bestMatch === -1 || index < bestMatch)) {
      bestMatch = index;
    }
  }

  if (bestMatch === -1) {
    return content.substring(0, maxLength) + "...";
  }

  const start = Math.max(0, bestMatch - 50);
  const end = Math.min(content.length, bestMatch + maxLength);
  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}

export type HomeSearchCTAProps = {
  variant?: "full" | "pill";
  className?: string;
  /** Class names merged into the pill trigger button (variant="pill" only). */
  pillTriggerClassName?: string;
};

export function HomeSearchCTA({
  variant = "full",
  className,
  pillTriggerClassName,
}: HomeSearchCTAProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DisplayDoc[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results: SearchResult[] = await response.json();

      const displayResults: DisplayDoc[] = results
        .slice(0, 8)
        .map((result) => {
          const title =
            result.title ||
            result.content ||
            (() => {
              const urlParts = result.url.split("/").filter(Boolean);
              const pageTitle = urlParts[urlParts.length - 1] || "Page";
              return pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
            })();

          let description = result.description || "No description available";
          let snippet = result.excerpt?.trim() || "";

          if (!snippet && result.content) {
            snippet = extractSnippet(result.content, query);
            if (!result.description || result.description === "") {
              description = snippet || description;
            }
          }

          return {
            title: title,
            description: description,
            href: result.url,
            type: result.type,
            snippet: snippet,
          };
        })
        .reduce((acc: DisplayDoc[], current) => {
          const existing = acc.find((item) => item.href === current.href);
          if (!existing) {
            acc.push(current);
          } else if (current.type === "page" && existing.type === "text") {
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
          return acc;
        }, [])
        .slice(0, 6);

      setSearchResults(displayResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/docs?search=${encodeURIComponent(searchQuery)}`);
      setCommandOpen(false);
    }
  };

  useEffect(() => {
    if (variant !== "pill") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  useEffect(() => {
    if (commandOpen && variant === "pill") {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [commandOpen, variant]);

  useEffect(() => {
    if (!commandOpen || variant !== "pill") return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [commandOpen, variant]);

  const resultsDropdown =
    showResults && (searchResults.length > 0 || isSearching) ? (
      <div
        className={cn(
          "z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-auto",
          variant === "pill" ? "relative" : "absolute"
        )}
      >
        {isSearching ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              Searching...
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} result
                {searchResults.length > 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close search results"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Separator className="my-2" />
            {searchResults.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="text-start block p-3 hover:bg-accent rounded-md transition-colors"
                onClick={() => {
                  setShowResults(false);
                  setCommandOpen(false);
                }}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <div className="font-medium text-foreground">
                    {highlightSearchTerms(doc.title, searchQuery)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1 ml-6 line-clamp-2">
                  {doc.snippet
                    ? highlightSearchTerms(doc.snippet, searchQuery)
                    : highlightSearchTerms(doc.description, searchQuery)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <p>No results found for &quot;{searchQuery}&quot;</p>
            <p className="text-xs mt-1">Try different keywords</p>
          </div>
        )}
      </div>
    ) : null;

  const form = (
    <form onSubmit={handleSearchSubmit} className="relative">
      <div className="relative isolate">
        <Search
          className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            void handleSearch(e.target.value);
          }}
          onFocus={() => {
            if (searchQuery && searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          className={cn(
            "relative z-0 pl-12 pr-4 text-lg border-2 border-border focus-visible:border-primary rounded-xl shadow-lg",
            variant === "pill" ? "h-12" : "h-14"
          )}
        />
      </div>
      {resultsDropdown}
    </form>
  );

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-muted-foreground text-sm border border-border hover:text-foreground transition-colors h-11",
            pillTriggerClassName
          )}
          aria-haspopup="dialog"
        >
          <span>Search...</span>
          <kbd className="ml-2 sm:ml-4 text-xs bg-accent px-1.5 py-0.5 rounded font-sans">
            ⌘K
          </kbd>
        </button>

        {commandOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
              aria-label="Close search"
              onClick={() => setCommandOpen(false)}
            />
            <div className="fixed left-1/2 top-[12vh] -translate-x-1/2 z-[101] w-[calc(100%-2rem)] max-w-2xl">
              <div
                className="rounded-xl border border-border bg-card p-4 shadow-lg"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Search documentation"
              >
                {form}
              </div>
            </div>
          </>
        ) : null}
      </>
    );
  }

  return (
    <div className={cn("max-w-2xl mx-auto mb-8", className)} ref={containerRef}>
      {form}
      {showResults && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-transparent border-0 p-0"
          aria-label="Dismiss search overlay"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
