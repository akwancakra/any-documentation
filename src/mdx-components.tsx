import defaultMdxComponents from "fumadocs-ui/mdx";

// Fumadocs UI Components
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Banner } from "fumadocs-ui/components/banner";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import { Step, Steps } from "fumadocs-ui/components/steps";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { createGenerator } from "fumadocs-typescript";
import { PDFViewer } from "./components/markdown-ui/pdf-viewer";
import { VideoViewer } from "./components/markdown-ui/video-viewer";
import Image from "next/image";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";

import type { MDXComponents } from "mdx/types";

const generator = createGenerator();

// Custom image component yang bisa handle markdown images
function CustomImage(props: any) {
  const { src, alt, ...rest } = props;

  // Jika ada width/height yang explicit, gunakan ImageZoom
  if (props.width && props.height) {
    return <ImageZoom {...props} />;
  }

  // Untuk markdown images tanpa explicit dimensions, gunakan fill approach
  return (
    <div className="relative w-full mx-auto my-6">
      <div className="relative min-h-[200px] w-full">
        <Image
          src={src}
          alt={alt || ""}
          fill
          className="object-contain rounded-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
          {...rest}
        />
      </div>
      {alt && (
        <p className="text-center text-sm text-muted-foreground mt-2 italic">
          {alt}
        </p>
      )}
    </div>
  );
}

// Custom table component untuk styling yang konsisten
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

// Custom pre component untuk auto-highlight code block markdown
function CustomPre(props: any) {
  const child = props.children;
  if (
    child &&
    child.props &&
    typeof child.props.className === "string" &&
    child.props.className.startsWith("language-")
  ) {
    const lang = child.props.className.replace("language-", "");
    const code =
      typeof child.props.children === "string"
        ? child.props.children
        : String(child.props.children);

    return <DynamicCodeBlock lang={lang} code={code.trim()} />;
  }
  // fallback jika bukan code block
  return <pre {...props} />;
}

// Fungsi slugify harus sama dengan extractTOC
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const headingWithId =
  (Tag: any) =>
  ({ children, ...props }: any) => {
    // Ambil string heading
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
        ? children.map((c) => (typeof c === "string" ? c : "")).join(" ")
        : "";
    const id = slugify(text);
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    ...TabsComponents,
    Accordions,
    Accordion,
    Banner,
    DynamicCodeBlock,
    img: CustomImage,
    table: CustomTable,
    thead: CustomThead,
    th: CustomTh,
    td: CustomTd,
    InlineTOC,
    Step,
    Steps,
    PDFViewer,
    VideoViewer,
    pre: CustomPre,
    // Override heading harus di paling akhir agar tidak tertimpa
    h1: headingWithId("h1"),
    h2: headingWithId("h2"),
    h3: headingWithId("h3"),
    h4: headingWithId("h4"),
    h5: headingWithId("h5"),
    h6: headingWithId("h6"),
  };
}
