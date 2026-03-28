import { cache } from "react";
import { getAllMDXFiles, getMDXFileBySlug } from "./mdx-utils";

export interface DynamicPage {
  data: {
    title: string;
    description: string;
    content: string;
    frontmatter: any;
    toc: any[];
    full?: boolean;
    lastModified: string;
  };
  slugs: string[];
  url: string;
}

export const getDynamicPage = cache(
  async (slugs?: string[]): Promise<DynamicPage | null> => {
    try {
      // Use MDX utils for consistent handling
      const mdxFile = await getMDXFileBySlug(slugs || []);

      if (!mdxFile) {
        return null;
      }

      // Convert to DynamicPage format
      const dynamicPage: DynamicPage = {
        data: {
          title: mdxFile.data.title,
          description: mdxFile.data.description,
          content: mdxFile.content,
          frontmatter: mdxFile.data,
          toc: extractTOC(mdxFile.content),
          full: mdxFile.data.full || false,
          lastModified: mdxFile.lastModified.toISOString(),
        },
        slugs: mdxFile.slug,
        url: mdxFile.url,
      };

      return dynamicPage;
    } catch (error) {
      console.error("Error loading dynamic page:", error);
      return null;
    }
  }
);

// Get all dynamic pages for navigation
export const getAllDynamicPages = cache(async (): Promise<DynamicPage[]> => {
  try {
    // Use MDX utils for consistent slug handling with sanitization
    const mdxFiles = await getAllMDXFiles();

    // Convert MDXFile to DynamicPage format
    const pages: DynamicPage[] = mdxFiles.map((file) => ({
      data: {
        title: file.data.title,
        description: file.data.description,
        content: file.content,
        frontmatter: file.data,
        toc: extractTOC(file.content),
        full: file.data.full || false,
        lastModified: file.lastModified.toISOString(),
      },
      slugs: file.slug,
      url: file.url,
    }));

    return pages;
  } catch (error) {
    console.error("Error scanning dynamic pages:", error);
    return [];
  }
});

// Generate navigation tree
export const generatePageTree = cache(async () => {
  const allPages = await getAllDynamicPages();

  // Simple tree structure for sidebar
  const tree: any = {
    name: "Documentation",
    children: [],
  };

  // Separate root pages from folder pages
  const rootPages: any[] = [];
  const folderGroups: Record<string, any[]> = {};

  for (const page of allPages) {
    if (page.slugs.length === 0) {
      // Root index page
      tree.children.unshift({
        type: "page",
        name: page.data.title,
        url: page.url,
      });
    } else if (page.slugs.length === 1) {
      // Root level pages (not in any folder)
      rootPages.push({
        type: "page",
        name: page.data.title,
        url: page.url,
      });
    } else {
      // Pages inside folders (slugs.length > 1)
      const firstSegment = page.slugs[0];
      if (!folderGroups[firstSegment]) {
        folderGroups[firstSegment] = [];
      }
      folderGroups[firstSegment].push({
        type: "page",
        name: page.data.title,
        url: page.url,
      });
    }
  }

  // Add root pages directly to tree
  tree.children.push(...rootPages);

  // Add folder groups to tree
  for (const [groupName, groupPages] of Object.entries(folderGroups)) {
    tree.children.push({
      type: "folder",
      name: groupName.charAt(0).toUpperCase() + groupName.slice(1),
      children: groupPages,
    });
  }

  return tree;
});

// Simple TOC extraction
function extractTOC(content: string): any[] {
  const toc: any[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      toc.push({
        title,
        url: `#${id}`,
        depth: level,
      });
    }
  }

  return toc;
}

// Cache is now handled by React cache and MDX utils
// No manual cache clearing needed
