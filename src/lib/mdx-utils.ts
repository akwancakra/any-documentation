import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface MDXFile {
  slug: string[];
  filePath: string;
  url: string;
  data: {
    title: string;
    description: string;
    [key: string]: any;
  };
  content: string;
  lastModified: Date;
}

export interface SearchableContent {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  slug: string[];
  structuredData: any;
}

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

/**
 * Sanitize path/slug components for URL-safe usage
 */
function sanitizeSlugComponent(component: string): string {
  return component
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-") // Replace invalid characters with dash
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * Parse a single MDX file and extract frontmatter and content
 */
export async function parseMDXFile(filePath: string): Promise<MDXFile | null> {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Get file stats for lastModified
    const stats = await fs.stat(filePath);

    // Generate slug from file path with sanitization
    const relativePath = path.relative(DOCS_DIR, filePath);
    const slug = relativePath
      .replace(/\.mdx$/, "")
      .split(path.sep)
      .filter(Boolean)
      .map(sanitizeSlugComponent) // Sanitize each path component
      .filter(Boolean); // Remove empty components after sanitization

    // Remove "index" from slug if it's the last part
    if (slug[slug.length - 1] === "index") {
      slug.pop();
    }

    const url = `/docs/${slug.join("/")}`;

    return {
      slug,
      filePath: relativePath,
      url,
      data: {
        title: data.title || "Untitled",
        description: data.description || "",
        ...data,
      },
      content,
      lastModified: stats.mtime,
    };
  } catch (error) {
    console.error(`Error parsing MDX file ${filePath}:`, error);
    return null;
  }
}

/**
 * Recursively scan directory for MDX files
 */
export async function scanMDXFiles(
  directory: string = DOCS_DIR
): Promise<string[]> {
  try {
    const files: string[] = [];
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanMDXFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
    return [];
  }
}

/**
 * Get all MDX files with their parsed content
 */
export async function getAllMDXFiles(): Promise<MDXFile[]> {
  try {
    const filePaths = await scanMDXFiles();
    const promises = filePaths.map(parseMDXFile);
    const results = await Promise.all(promises);

    // Filter out null results and return only valid MDX files
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
    console.log(`[MDX Utils] Getting latest ${limit} MDX files`);
    const allFiles = await getAllMDXFiles();

    console.log(`[MDX Utils] Found ${allFiles.length} total files`);

    const sortedFiles = allFiles
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, limit);

    console.log(
      `[MDX Utils] Returning ${sortedFiles.length} latest files:`,
      sortedFiles.map((f) => ({
        title: f.data.title,
        slug: f.slug,
        url: f.url,
        lastModified: f.lastModified.toISOString(),
      }))
    );

    return sortedFiles;
  } catch (error) {
    console.error("Error getting latest MDX files:", error);
    return [];
  }
}

const PLAIN_PREVIEW_MAX = 200;

/**
 * Strip MDX / markdown noise for search excerpts (best-effort).
 */
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

/**
 * Short excerpt around the first query hit in plain text, or leading text when no hit / empty query.
 */
export function excerptAroundQuery(
  rawMdx: string,
  query: string,
  radius = 85
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

/**
 * Subtitle for search UI: prefer description when it matches query; else body excerpt around query.
 */
export function pickSearchExcerpt(
  query: string,
  description: string,
  rawMdx: string
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

/**
 * Search in MDX files content
 */
export async function searchMDXFiles(
  query: string
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

      // Simple search implementation - can be improved with better matching algorithm
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

/**
 * Extract structured data from MDX content for search indexing
 */
function extractStructuredData(content: string): any {
  try {
    // Extract headings for structured data
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
      sections: headings.filter((h) => h.level <= 3), // Only include major headings
    };
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return { headings: [], sections: [] };
  }
}

/**
 * Get a specific MDX file by slug
 */
export async function getMDXFileBySlug(
  slug: string[]
): Promise<MDXFile | null> {
  try {
    // Try different possible file paths
    const possiblePaths = [
      path.join(DOCS_DIR, ...slug) + ".mdx",
      path.join(DOCS_DIR, ...slug, "index.mdx"),
    ];

    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath);
        return await parseMDXFile(filePath);
      } catch {
        // Try next path
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting MDX file by slug ${slug.join("/")}:`, error);
    return null;
  }
}

/**
 * Check if MDX file exists
 */
export async function mdxFileExists(slug: string[]): Promise<boolean> {
  const file = await getMDXFileBySlug(slug);
  return file !== null;
}
