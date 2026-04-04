import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-3.5 text-base leading-normal text-muted-foreground sm:flex-row sm:gap-6 md:px-12">
          <p className="order-2 sm:order-1">© {year} Any Documentation</p>
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
            <a
              href="https://github.com/akwancakra"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://akwancakra.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Web
            </a>
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
              "max-w-full whitespace-nowrap text-center font-light uppercase leading-none tracking-[0.04em] antialiased text-[clamp(4.2rem,calc(2.4vw+2.2rem),min(50rem,90vw))] text-foreground/[0.055] transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:text-foreground/[0.11] group-hover:tracking-[0.0em] group-hover:[text-shadow:0_0_70px_color-mix(in_oklch,var(--foreground)_16%,transparent)] sm:tracking-[-0.05em] dark:text-foreground/[0.07] dark:group-hover:text-foreground/[0.13]",
            )}
          >
            ANY DOCUMENTATION
          </p>
        </div>
        <div className="flex min-w-0 flex-col items-center justify-center select-none pb-8">
          <p className="mt-7 font-normal text-xs text-muted-foreground flex items-center gap-2">
            Made with
            <span className="text-red-500" aria-label="love">
              &hearts;
            </span>
            by{" "}
            <a
              href="https://akwancakra.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Akwan Cakra Tajimalela
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
