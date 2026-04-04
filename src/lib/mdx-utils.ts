import matter from "gray-matter";
import { getDocsStorage } from "@/lib/docs-storage";
import { isFolderKeepKey } from "@/lib/docs-storage/keys";

export interface MDXFrontmatter {
  title: string;
  description: string;
  full?: boolean;
  [key: string]: unknown;
}

export interface MDXFile {
  slug: string[];
  filePath: string;
  url: string;
  data: MDXFrontmatter;
  content: string;
  lastModified: Date;
}

export interface StructuredData {
  headings: { id: string; text: string; level: number }[];
  sections: { id: string; text: string; level: number }[];
}

export interface SearchableContent {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  slug: string[];
  structuredData: StructuredData;
}

/**
 * Sanitize path/slug components for URL-safe usage
 */
function sanitizeSlugComponent(component: string): string {
  return component
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromRelKey(relKey: string): string[] {
  const withoutExt = relKey.replace(/\.mdx$/i, "");
  const segments = withoutExt.split("/").filter(Boolean);
  const slug = segments
    .map(sanitizeSlugComponent)
    .filter(Boolean);
  if (slug[slug.length - 1] === "index") {
    slug.pop();
  }
  return slug;
}

function urlFromSlug(slug: string[]): string {
  return `/docs/${slug.join("/")}`;
}

/**
 * Parse MDX from a storage-relative key (posix, under content/docs).
 */
export async function parseMDXRelKey(relKey: string): Promise<MDXFile | null> {
  try {
    if (!relKey.endsWith(".mdx") || isFolderKeepKey(relKey)) {
      return null;
    }
    const storage = getDocsStorage();
    const fileContent = await storage.getText(relKey);
    if (fileContent === null) {
      return null;
    }
    const { data, content } = matter(fileContent);
    const head = await storage.head(relKey);
    const lastModified = head?.lastModified ?? new Date();

    const slug = slugFromRelKey(relKey);

    return {
      slug,
      filePath: relKey,
      url: urlFromSlug(slug),
      data: {
        title: data.title || "Untitled",
        description: data.description || "",
        ...data,
      },
      content,
      lastModified,
    };
  } catch (error) {
    console.error(`Error parsing MDX rel key ${relKey}:`, error);
    return null;
  }
}

/** @deprecated Use parseMDXRelKey — accepts absolute path only for legacy callers (local fs). */
export async function parseMDXFile(filePath: string): Promise<MDXFile | null> {
  const normalized = filePath.replace(/\\/g, "/");
  const marker = "/content/docs/";
  const idx = normalized.indexOf(marker);
  const rel =
    idx >= 0
      ? normalized.slice(idx + marker.length)
      : normalized.split("content/docs/").pop() ?? normalized;
  if (!rel) return null;
  return parseMDXRelKey(rel);
}

/**
 * Recursively scan for MDX keys via configured storage
 */
export async function scanMDXRelKeys(): Promise<string[]> {
  const storage = getDocsStorage();
  const keys = await storage.listAllKeys();
  return keys.filter(
    (k) => k.endsWith(".mdx") && !isFolderKeepKey(k),
  );
}

/**
 * Get all MDX files with their parsed content
 */
export async function getAllMDXFiles(): Promise<MDXFile[]> {
  try {
    const relKeys = await scanMDXRelKeys();
    const results = await Promise.all(
      relKeys.map((k) => parseMDXRelKey(k)),
    );
    return results.filter((file): file is MDXFile => file !== null);
  } catch (error) {
    console.error("Error getting all MDX files:", error);
    return [];
  }
}

/**
 * Get latest modified MDX files
 */
export async function getLatestMDXFiles(limit: number = 4): Promise<MDXFile[]> {
  try {
    const allFiles = await getAllMDXFiles();
    return allFiles
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting latest MDX files:", error);
    return [];
  }
}

const PLAIN_PREVIEW_MAX = 200;

export function plainTextFromMdx(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/[*_~]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptAroundQuery(
  rawMdx: string,
  query: string,
  radius = 85,
): string {
  const plain = plainTextFromMdx(rawMdx);
  const q = query.trim().toLowerCase();
  if (!plain) return "";

  if (!q) {
    return plain.length > PLAIN_PREVIEW_MAX
      ? `${plain.slice(0, PLAIN_PREVIEW_MAX).trim()}…`
      : plain;
  }

  const lower = plain.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) {
    return plain.length > PLAIN_PREVIEW_MAX
      ? `${plain.slice(0, PLAIN_PREVIEW_MAX).trim()}…`
      : plain;
  }

  const start = Math.max(0, idx - radius);
  const end = Math.min(plain.length, idx + q.length + radius);
  let slice = plain.slice(start, end).trim();
  if (start > 0) slice = `…${slice}`;
  if (end < plain.length) slice = `${slice}…`;
  return slice;
}

export function pickSearchExcerpt(
  query: string,
  description: string,
  rawMdx: string,
): string {
  const desc = description.trim();
  const q = query.trim().toLowerCase();

  if (!q) {
    if (desc)
      return desc.length > PLAIN_PREVIEW_MAX
        ? `${desc.slice(0, PLAIN_PREVIEW_MAX).trim()}…`
        : desc;
    return excerptAroundQuery(rawMdx, "");
  }

  if (desc && desc.toLowerCase().includes(q)) {
    return desc.length > PLAIN_PREVIEW_MAX
      ? `${desc.slice(0, PLAIN_PREVIEW_MAX).trim()}…`
      : desc;
  }

  return excerptAroundQuery(rawMdx, query);
}

export async function searchMDXFiles(
  query: string,
): Promise<SearchableContent[]> {
  try {
    const allFiles = await getAllMDXFiles();
    const searchResults: SearchableContent[] = [];

    for (const file of allFiles) {
      const searchableContent: SearchableContent = {
        id: file.url,
        title: file.data.title,
        description: file.data.description,
        content: file.content,
        url: file.url,
        slug: file.slug,
        structuredData: extractStructuredData(file.content),
      };

      const searchText = query.toLowerCase();
      const titleMatch = file.data.title.toLowerCase().includes(searchText);
      const descriptionMatch = file.data.description
        .toLowerCase()
        .includes(searchText);
      const contentMatch = file.content.toLowerCase().includes(searchText);

      if (titleMatch || descriptionMatch || contentMatch) {
        searchResults.push(searchableContent);
      }
    }

    return searchResults;
  } catch (error) {
    console.error("Error searching MDX files:", error);
    return [];
  }
}

function extractStructuredData(content: string): StructuredData {
  try {
    const headings: { id: string; text: string; level: number }[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      headings.push({ id, text, level });
    }

    return {
      headings,
      sections: headings.filter((h) => h.level <= 3),
    };
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return { headings: [], sections: [] };
  }
}

/**
 * Get a specific MDX file by slug (URL segments)
 */
export async function getMDXFileBySlug(
  slug: string[],
): Promise<MDXFile | null> {
  try {
    const storage = getDocsStorage();
    const base = slug.filter(Boolean).join("/");
    const candidates = base
      ? [`${base}.mdx`, `${base}/index.mdx`]
      : [`index.mdx`];

    for (const relKey of candidates) {
      if (await storage.exists(relKey)) {
        const parsed = await parseMDXRelKey(relKey);
        if (parsed) return parsed;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting MDX file by slug ${slug.join("/")}:`, error);
    return null;
  }
}

export async function mdxFileExists(slug: string[]): Promise<boolean> {
  const file = await getMDXFileBySlug(slug);
  return file !== null;
}
