import type { Metadata } from "next";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getDynamicPage } from "@/lib/dynamic-source";
import { getMDXComponents } from "@/mdx-components";
import remarkGfm from "remark-gfm";
import { EditButton } from "../_components/EditButton";

// Force dynamic rendering - NO STATIC GENERATION!
export const dynamic = "force-dynamic";

interface DocPageParams {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function Page(props: DocPageParams) {
  const params = await props.params;
  const page = await getDynamicPage(params.slug);

  if (!page) {
    notFound();
  }

  // Ambil zona waktu dari env atau fallback Asia/Jakarta
  const timeZone = process.env.TZ || process.env.TIMEZONE || "Asia/Jakarta";
  const date = new Date(page.data.lastModified);
  const lastModifiedFormatted = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      footer={{ enabled: false }}
    >
      <DocsBody>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          {page.data.title}
          <EditButton slug={params.slug || []} />
        </h1>
        {page.data.description && (
          <p className="mb-8 text-lg text-muted-foreground">
            {page.data.description}
          </p>
        )}

        <div className="prose max-w-none dark:prose-invert">
          <MDXRemote
            source={page.data.content}
            components={getMDXComponents()}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          Last modified: {lastModifiedFormatted}
        </div>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(
  props: DocPageParams,
): Promise<Metadata> {
  const params = await props.params;
  const page = await getDynamicPage(params.slug);

  if (!page) {
    return {};
  }

  const title = page.data.title || "Wiki Docs";
  const description = page.data.description || "Dokumentasi wiki";
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const url = `${baseUrl}/docs/${(params.slug || []).join("/")}`;
  const image = `${baseUrl}/banner-default.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}
