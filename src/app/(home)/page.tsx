import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLatestMDXFiles } from "@/lib/mdx-utils";
import { HeroGridBackdrop } from "@/components/shell/hero-grid-backdrop";
import { Navbar } from "@/components/shell/navbar";
import { formatDateShort } from "@/lib/formatters";
import { SearchDocsButton } from "./_components/search-docs-button";

export const dynamic = "force-dynamic";

interface DocFile {
  title: string;
  description: string;
  slug: string[];
  href: string;
  lastModified: string;
}

async function getLatestDocs(): Promise<DocFile[]> {
  try {
    const latestFiles = await getLatestMDXFiles(4);

    return latestFiles.map((file) => ({
      title: file.data.title,
      description: file.data.description,
      slug: file.slug,
      href: file.url,
      lastModified: file.lastModified.toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const latestDocs = await getLatestDocs();

  return (
    <>
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground mb-8">
            <span>Open source • Build your docs with MDX</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-medium tracking-tight text-foreground max-w-4xl leading-[1.1]">
            <span className="text-muted-foreground">Find</span> what you need
          </h1>

          <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-2xl">
            Search across all pages, then jump into the latest updates below.
          </p>

          <div className="mt-10 flex w-full max-w-3xl flex-col flex-wrap items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="pill" className="gap-2">
              <Link href="/docs">
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <SearchDocsButton />
          </div>
        </div>
      </section>

      <section className="ds-section-canvas pt-6 md:pt-10">
        <HeroGridBackdrop variant="section" />

        <div className="relative z-10 py-12 md:py-16 ds-page-shell">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="text-lg md:text-xl font-medium tracking-tight text-foreground flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border text-sm">
                <FileText className="h-4 w-4" />
              </span>
              Latest docs
            </h2>
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {latestDocs.length > 0 ? (
              latestDocs.map((doc) => (
                <Link href={doc.href} key={doc.href} className="group block">
                  <Card className="h-full rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 text-left">
                          <CardTitle className="text-lg font-medium tracking-tight group-hover:text-primary transition-colors">
                            {doc.title}
                          </CardTitle>
                          <CardDescription className="mt-2 line-clamp-2 text-left">
                            {doc.description || "No description available"}
                          </CardDescription>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center text-sm text-muted-foreground min-w-0">
                          <FileText className="h-4 w-4 mr-1.5 shrink-0 opacity-70" />
                          <span className="truncate font-mono text-xs">
                            {doc.href
                              .replace("/docs/", "")
                              .replace("/", " / ") || "Root"}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0 rounded-full px-2.5"
                        >
                          {formatDateShort(doc.lastModified)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-14 px-6 text-muted-foreground rounded-2xl border border-dashed border-border bg-card/30 backdrop-blur-sm">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium text-foreground">No pages yet</p>
                <p className="text-sm mt-1">
                  Add MDX under content to see them here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
