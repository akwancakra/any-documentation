"use client";
import { useDocsSearch } from "fumadocs-core/search/client";
import type { SortedResult } from "fumadocs-core/server";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { highlightSearchTerms } from "@/lib/search-highlight";

type SearchHit = SortedResult & {
  excerpt?: string;
  description?: string;
  title?: string;
};

/** Slightly softer inside Fumadocs dialog (popover tokens). */
const FD_SUBTLE_MARK =
  "rounded-[2px] bg-fd-primary/8 px-px font-inherit text-inherit dark:bg-fd-primary/14";

function SearchHitRow({
  item,
  onClick,
  query,
}: {
  item: SearchHit;
  onClick: () => void;
  query: string;
}) {
  const sub =
    (item.excerpt?.trim() || item.description?.trim() || "").trim();

  return (
    <SearchDialogListItem
      item={item}
      onClick={onClick}
      className="items-start gap-3 py-2.5"
    >
      <FileText className="size-4 shrink-0 text-fd-muted-foreground" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
        <span className="truncate text-sm font-medium text-fd-foreground">
          {highlightSearchTerms(String(item.content), query, FD_SUBTLE_MARK)}
        </span>
        {sub ? (
          <span className="line-clamp-2 text-xs text-fd-muted-foreground">
            {highlightSearchTerms(sub, query, FD_SUBTLE_MARK)}
          </span>
        ) : null}
      </span>
    </SearchDialogListItem>
  );
}

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n(); // (optional) for i18n
  const pathname = usePathname();
  const [tag, setTag] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  // Get current file path for filtering
  const getCurrentFilePath = () => {
    if (pathname.startsWith("/docs")) {
      return pathname;
    }
    return undefined;
  };

  const currentFilePath = getCurrentFilePath();

  const { search, setSearch, query } = useDocsSearch({
    tag: tag || undefined, // Convert empty string to undefined
    type: "fetch",
    locale,
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={
            query.data !== "empty"
              ? (query.data as SearchHit[] | undefined)
              : null
          }
          Item={({ item, onClick }) => (
            <SearchHitRow
              item={item as SearchHit}
              onClick={onClick}
              query={search}
            />
          )}
        />
        <SearchDialogFooter className="flex flex-row">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border rounded px-3 py-1 flex items-center gap-1 text-sm bg-background hover:bg-accent transition"
              >
                <span className="text-xs text-muted-foreground">Filter:</span>
                <span className="text-xs">
                  {tag === currentFilePath ? "Current File" : "Full Docs"}
                </span>
                {open ? (
                  <ChevronUpIcon className="w-4 h-4 ml-1 opacity-70" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-1 opacity-70" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={() => {
                  setTag("");
                  setOpen(false);
                }}
                className={tag !== currentFilePath ? "font-semibold" : ""}
              >
                <div className="flex flex-col">
                  <span>Full Docs</span>
                  <span className="text-xs text-muted-foreground">
                    Search in all documents
                  </span>
                </div>
              </DropdownMenuItem>
              {currentFilePath && (
                <DropdownMenuItem
                  onSelect={() => {
                    setTag(currentFilePath);
                    setOpen(false);
                  }}
                  className={tag === currentFilePath ? "font-semibold" : ""}
                >
                  <div className="flex flex-col">
                    <span>Current File</span>
                    <span className="text-xs text-muted-foreground">
                      Search only in this document
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
