import Link from "next/link";
import { Oswald } from "next/font/google";
import { cn } from "@/lib/utils";

const oswaldDisplay = Oswald({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-3.5 text-base leading-normal text-muted-foreground sm:flex-row sm:gap-6 md:px-12">
          <p className="order-2 sm:order-1">© {year} Wiki Docs</p>
          <nav
            className="order-1 flex items-center gap-6 text-base sm:order-2"
            aria-label="Footer"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <Link
              href="/docs"
              className="transition-colors hover:text-foreground"
            >
              Docs
            </Link>
          </nav>
        </div>
      </div>

      <div className="group relative cursor-default overflow-x-auto overflow-y-hidden border-t border-border/30 bg-muted/10 transition-colors duration-500 hover:bg-muted/20">
        <div
          className="flex min-w-0 flex-col items-center justify-center select-none px-3 py-8 sm:px-6 sm:py-20"
          aria-hidden
        >
          <p
            className={cn(
              oswaldDisplay.className,
              "max-w-full whitespace-nowrap text-center font-light uppercase leading-none tracking-[0.04em] antialiased text-[clamp(4.2rem,calc(6.4vw+2.2rem),min(50rem,90vw))] text-foreground/[0.055] transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:text-foreground/[0.11] group-hover:tracking-[0.0em] group-hover:[text-shadow:0_0_70px_color-mix(in_oklch,var(--foreground)_16%,transparent)] sm:tracking-[-0.05em] dark:text-foreground/[0.07] dark:group-hover:text-foreground/[0.13]",
            )}
          >
            ANY DOCUMENTATION
          </p>
        </div>
      </div>
    </footer>
  );
}
