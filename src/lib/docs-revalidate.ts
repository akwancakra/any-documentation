import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalidate cached RSC output for docs after MDX or tree changes.
 */
export function revalidateDocsContent(options?: {
  /** Relative MDX path e.g. `guide/page.mdx` */
  mdxRelPath?: string;
  /** When renaming/moving, also invalidate the old public URL */
  previousMdxRelPath?: string;
}): void {
  revalidatePath("/docs", "layout");
  revalidatePath("/docs", "page");
  revalidateTag("docs-content");

  const paths = new Set<string>();
  if (options?.mdxRelPath) {
    const slug = options.mdxRelPath.replace(/\.mdx$/, "");
    paths.add(`/docs/${slug}`);
  }
  if (options?.previousMdxRelPath) {
    const slug = options.previousMdxRelPath.replace(/\.mdx$/, "");
    paths.add(`/docs/${slug}`);
  }
  for (const p of paths) {
    revalidatePath(p);
  }

  if (options?.mdxRelPath === "index.mdx") {
    revalidatePath("/docs");
  }
  if (options?.previousMdxRelPath === "index.mdx") {
    revalidatePath("/docs");
  }
}
