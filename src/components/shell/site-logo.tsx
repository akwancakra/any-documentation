import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  /** false = teks saja (untuk nav Fumadocs tanpa nested link) */
  asLink?: boolean;
  className?: string;
  /** sm = ikon 32px raster untuk nav docs/padat; md = icon.png penuh */
  size?: "md" | "sm";
};

export function SiteLogo({
  asLink = true,
  className,
  size = "md",
}: SiteLogoProps) {
  const icon =
    size === "sm" ? (
      <Image
        src="/images/favicons/favicon-32x32.png"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded object-cover"
        priority
      />
    ) : (
      <Image
        src="/images/icon.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-md object-cover"
        priority
      />
    );

  const label = (
    <>
      {icon}
      <span className="truncate">Any Docs</span>
    </>
  );

  const base =
    "flex items-center gap-2 text-xl font-bold tracking-tight text-foreground";

  if (asLink) {
    return (
      <Link
        href="/"
        className={cn(base, "shrink-0", className)}
        aria-label="Any Documentation — beranda"
      >
        {label}
      </Link>
    );
  }

  return (
    <span
      className={cn(base, className)}
      aria-label="Any Documentation"
    >
      {icon}
      <span aria-hidden className="truncate">
        Any Docs
      </span>
    </span>
  );
}
