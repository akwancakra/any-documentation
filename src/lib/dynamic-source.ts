import { cache } from "react";
import { getAllMDXFiles, getMDXFileBySlug, type MDXFrontmatter } from "./mdx-utils";

export interface TocEntry {
  title: string;
  url: string;
  depth: number;
}

interface PageNode {
  type: "page";
  name: string;
  url: string;
}

interface FolderNode {
  type: "folder";
  name: string;
  children: PageNode[];
}

type TreeNode = PageNode | FolderNode;

interface PageTree {
  name: string;
  children: TreeNode[];
}

export interface DynamicPage {
  data: {
    title: string;
    description: string;
    content: string;
    frontmatter: MDXFrontmatter;
    toc: TocEntry[];
    full?: boolean;
    lastModified: string;
  };
  slugs: string[];
  url: string;
}

export const getDynamicPage = cache(
  async (slugs?: string[]): Promise<DynamicPage | null> => {
    try {
      const mdxFile = await getMDXFileBySlug(slugs || []);

      if (!mdxFile) {
        return null;
      }

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

export const getAllDynamicPages = cache(async (): Promise<DynamicPage[]> => {
  try {
    const mdxFiles = await getAllMDXFiles();

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

export const generatePageTree = cache(async (): Promise<PageTree> => {
  const allPages = await getAllDynamicPages();

  const tree: PageTree = {
    name: "Documentation",
    children: [],
  };

  const rootPages: PageNode[] = [];
  const folderGroups: Record<string, PageNode[]> = {};

  for (const page of allPages) {
    if (page.slugs.length === 0) {
      tree.children.unshift({
        type: "page",
        name: page.data.title,
        url: page.url,
      });
    } else if (page.slugs.length === 1) {
      rootPages.push({
        type: "page",
        name: page.data.title,
        url: page.url,
      });
    } else {
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

  tree.children.push(...rootPages);

  for (const [groupName, groupPages] of Object.entries(folderGroups)) {
    tree.children.push({
      type: "folder",
      name: groupName.charAt(0).toUpperCase() + groupName.slice(1),
      children: groupPages,
    });
  }

  return tree;
});

function extractTOC(content: string): TocEntry[] {
  const toc: TocEntry[] = [];
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
