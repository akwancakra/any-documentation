import { cn } from "@/lib/utils";

type HeroGridBackdropProps = {
  variant?: "hero" | "section";
  className?: string;
};

/**
 * Background grid dari design system home (token --hero-grid + mask).
 */
export function HeroGridBackdrop({
  variant = "hero",
  className,
}: HeroGridBackdropProps) {
  const isSection = variant === "section";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-[length:48px_48px]",
        isSection && "opacity-[0.35]",
        className,
      )}
      style={{
        backgroundImage: "var(--hero-grid)",
        WebkitMaskImage: isSection
          ? "var(--hero-grid-mask-section)"
          : "var(--hero-grid-mask)",
        maskImage: isSection
          ? "var(--hero-grid-mask-section)"
          : "var(--hero-grid-mask)",
      }}
      aria-hidden
    />
  );
}
