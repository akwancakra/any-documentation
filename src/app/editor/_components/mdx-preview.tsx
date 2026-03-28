"use client";

import { useState, useEffect, useMemo } from "react";
import { extractFrontmatterMeta } from "@/lib/mdx-frontmatter-meta";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

// Fumadocs UI components — same as /docs page
import { Callout } from "fumadocs-ui/components/callout";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Banner } from "fumadocs-ui/components/banner";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import * as TabsComponents from "fumadocs-ui/components/tabs";

// Custom components — same as mdx-components.tsx
import { PDFViewer } from "@/components/markdown-ui/pdf-viewer";
import { VideoViewer } from "@/components/markdown-ui/video-viewer";

interface MDXPreviewProps {
  content: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const headingWithId =
  (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") =>
  ({ children, ...props }: any) => {
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
        ? children.map((c: any) => (typeof c === "string" ? c : "")).join(" ")
        : "";
    const id = slugify(text);
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };

function CustomTable(props: any) {
  return (
    <div className="my-6 w-full overflow-x-auto">
      <table
        className="w-full border-collapse border border-border rounded-md"
        {...props}
      />
    </div>
  );
}

function CustomThead(props: any) {
  return <thead className="bg-muted/50" {...props} />;
}

function CustomTh(props: any) {
  return (
    <th
      className="border border-border px-4 py-2 text-left font-semibold text-foreground"
      {...props}
    />
  );
}

function CustomTd(props: any) {
  return (
    <td className="border border-border px-4 py-2 text-foreground" {...props} />
  );
}

// Code block via fumadocs CodeBlock + Pre (no Shiki in client preview; safe)
// Matches /docs UI: copy button, rounded container, etc.
function renderCodeBlock(code: string, lang?: string, title?: string) {
  const lines = code.trim().split("\n");
  return (
    <CodeBlock title={title} lang={lang}>
      <Pre>
        <code>
          {lines.map((line, i) => (
            <span key={i} className="line">
              {line}
              {i < lines.length - 1 ? "\n" : ""}
            </span>
          ))}
        </code>
      </Pre>
    </CodeBlock>
  );
}

// Markdown fenced code blocks render as <pre><code class="language-…">
function CustomPre(props: any) {
  const child = props.children;
  if (
    child &&
    child.props &&
    typeof child.props.className === "string" &&
    child.props.className.startsWith("language-")
  ) {
    const lang = child.props.className.replace("language-", "");
    const raw = child.props.children;
    const code = typeof raw === "string" ? raw : String(raw ?? "");
    return renderCodeBlock(code, lang);
  }
  // Fallback: <pre> without a language class
  return (
    <CodeBlock>
      <Pre {...props} />
    </CodeBlock>
  );
}

// DynamicCodeBlock replacement; `code` may be missing after client MDX serialize.
function SafeCodeBlock({ lang, code, title, ...props }: any) {
  if (code === undefined || code === null) {
    return renderCodeBlock(
      "// [Preview] Code could not be rendered here.\n// Use a markdown fenced block instead:\n// ```javascript\n// console.log('hello');\n// ```",
      lang ?? "text",
      title
    );
  }
  const safeCode = typeof code === "string" ? code : String(code);
  return renderCodeBlock(safeCode, lang, title);
}

// MDX components — aligned with getMDXComponents() from src/mdx-components.tsx
const components = {
  // Fumadocs components
  Callout,
  Card,
  Cards,
  Accordion,
  Accordions,
  Step,
  Steps,
  Banner,
  InlineTOC: () => (
    <div className="text-xs text-muted-foreground border rounded px-3 py-2 my-4">
      [Table of contents — shown on /docs pages]
    </div>
  ),
  ImageZoom,
  DynamicCodeBlock: SafeCodeBlock,

  // Tabs from fumadocs (same as /docs)
  ...TabsComponents,

  // Custom media
  PDFViewer,
  VideoViewer,

  // Shared table styling
  table: CustomTable,
  thead: CustomThead,
  th: CustomTh,
  td: CustomTd,

  // Code rendering — same as /docs
  pre: CustomPre,
  code: ({ children, ...props }: any) => (
    <code
      className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),

  // Headings with anchor IDs — same as /docs
  h1: headingWithId("h1"),
  h2: headingWithId("h2"),
  h3: headingWithId("h3"),
  h4: headingWithId("h4"),
  h5: headingWithId("h5"),
  h6: headingWithId("h6"),

  // Typography
  p: ({ children, ...props }: any) => (
    <p className="leading-7 mb-4" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc ml-6 space-y-1 mb-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal ml-6 space-y-1 mb-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-muted-foreground/25 pl-4 italic text-muted-foreground my-4"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-primary underline decoration-primary underline-offset-4 hover:decoration-2"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      className="rounded-lg border my-4 max-w-full h-auto"
      {...props}
    />
  ),
  hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => <em {...props}>{children}</em>,
};

const MDXPreview = ({ content }: MDXPreviewProps) => {
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { title: docTitle, description: docDescription } = useMemo(
    () => extractFrontmatterMeta(content),
    [content],
  );

  // Defer render until after mount to avoid Radix hydration id mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const processMDX = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const contentWithoutFrontmatter = content.replace(
          /^---[\s\S]*?---\n?/,
          ""
        );

        const serialized = await serialize(contentWithoutFrontmatter, {
          parseFrontmatter: false,
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [],
            development: process.env.NODE_ENV === "development",
          },
        });

        if (!cancelled) setMdxSource(serialized);
      } catch (err) {
        console.error("MDX processing error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to process MDX"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    processMDX();
    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="text-xs text-muted-foreground">
          {isLoading ? "Processing…" : "Live preview"}
        </div>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="p-6 max-w-none min-h-full">
          {!isMounted || isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                Processing MDX…
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-start justify-center gap-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <p className="text-sm font-medium text-destructive">
                MDX error:
              </p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                {error}
              </pre>
            </div>
          ) : mdxSource ? (
            <>
              {docTitle ? (
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  {docTitle}
                </h1>
              ) : null}
              {docDescription ? (
                <p className="mb-8 text-lg text-muted-foreground">
                  {docDescription}
                </p>
              ) : null}
              <div className="prose max-w-none dark:prose-invert">
                <MDXRemote {...mdxSource} components={components} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                Nothing to preview
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MDXPreview;
