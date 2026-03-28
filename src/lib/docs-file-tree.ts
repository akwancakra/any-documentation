import fs from "fs/promises";
import path from "path";
import type { DocsStorage } from "@/lib/docs-storage/types";
import { FsDocsStorage } from "@/lib/docs-storage/fs-storage";
import { isFolderKeepKey } from "@/lib/docs-storage/keys";

export interface FileTreeNode {
  name: string;
  children?: string[];
}

export interface FileTreeResult {
  tree: Record<string, FileTreeNode>;
  rootId: string;
}

async function buildFileTreeFromDisk(
  docsDir: string,
): Promise<FileTreeResult> {
  const tree: Record<string, FileTreeNode> = {
    docs: {
      name: "docs",
      children: [],
    },
  };

  async function buildFileTreeDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const relativeDir = path.relative(docsDir, dir);
    const parentId =
      relativeDir === "" ? "docs" : relativeDir.replace(/\\/g, "/");

    if (!tree[parentId]) {
      tree[parentId] = {
        name: path.basename(dir),
        children: [],
      };
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(docsDir, fullPath);
      const id = relativePath.replace(/\\/g, "/");

      if (entry.isDirectory()) {
        tree[id] = { name: entry.name, children: [] };
        tree[parentId].children?.push(id);
        await buildFileTreeDir(fullPath);
      } else if (entry.isFile()) {
        tree[id] = { name: entry.name };
        tree[parentId].children?.push(id);
      }
    }
  }

  await buildFileTreeDir(docsDir);

  for (const key in tree) {
    tree[key].children?.sort((a, b) => {
      const aIsFolder = !!tree[a].children;
      const bIsFolder = !!tree[b].children;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });
  }

  return { tree, rootId: "docs" };
}

function buildFileTreeFromObjectKeys(keys: string[]): FileTreeResult {
  const tree: Record<string, FileTreeNode> = {
    docs: { name: "docs", children: [] },
  };

  const ensureFolder = (folderRel: string) => {
    if (!folderRel) return;
    const parts = folderRel.split("/").filter(Boolean);
    let acc = "";
    for (const part of parts) {
      const parentId = acc === "" ? "docs" : acc;
      acc = acc === "" ? part : `${acc}/${part}`;
      if (!tree[acc]) {
        tree[acc] = { name: part, children: [] };
      }
      const parent = tree[parentId];
      if (!parent.children) parent.children = [];
      if (!parent.children.includes(acc)) {
        parent.children.push(acc);
      }
    }
  };

  const addFile = (key: string, fileName: string, folderRel: string) => {
    const parentId = folderRel === "" ? "docs" : folderRel;
    ensureFolder(folderRel);
    tree[key] = { name: fileName };
    const parent = tree[parentId];
    if (!parent.children) parent.children = [];
    if (!parent.children.includes(key)) {
      parent.children.push(key);
    }
  };

  for (const key of [...keys].sort()) {
    if (isFolderKeepKey(key)) {
      const folderRel = key.endsWith(`/.keep`)
        ? key.slice(0, -"/.keep".length)
        : "";
      if (folderRel) ensureFolder(folderRel);
      continue;
    }
    const parts = key.split("/");
    const fileName = parts.pop()!;
    const folderRel = parts.join("/");
    addFile(key, fileName, folderRel);
  }

  for (const k in tree) {
    tree[k].children?.sort((a, b) => {
      const aIsFolder = !!tree[a].children;
      const bIsFolder = !!tree[b].children;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });
  }

  return { tree, rootId: "docs" };
}

export async function buildDocsFileTree(
  storage: DocsStorage,
): Promise<FileTreeResult> {
  if (storage instanceof FsDocsStorage) {
    return buildFileTreeFromDisk(storage.docsDir);
  }
  const keys = await storage.listAllKeys();
  return buildFileTreeFromObjectKeys(keys);
}
