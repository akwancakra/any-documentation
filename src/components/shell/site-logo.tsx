import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  /** false = teks saja (untuk nav Fumadocs tanpa nested link) */
  asLink?: boolean;
  className?: string;
};

export function SiteLogo({ asLink = true, className }: SiteLogoProps) {
  const inner = (
    <>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground font-black text-sm text-background">
        W
      </span>
      <span className="truncate">Wiki Docs</span>
    </>
  );

  const base =
    "flex items-center gap-2 text-xl font-bold tracking-tight text-foreground";

  if (asLink) {
    return (
      <Link href="/" className={cn(base, "shrink-0", className)}>
        {inner}
      </Link>
    );
  }

  return <span className={cn(base, className)}>{inner}</span>;
}
