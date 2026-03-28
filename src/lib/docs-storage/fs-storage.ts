import fs from "fs/promises";
import path from "path";
import type { DocsStorage, ObjectHead } from "./types";
import { folderKeepRelKey, normalizeDocRelKey } from "./keys";

export class FsDocsStorage implements DocsStorage {
  constructor(readonly docsDir: string) {}

  private resolve(relKey: string): string {
    const key = normalizeDocRelKey(relKey);
    return path.join(this.docsDir, ...key.split("/"));
  }

  async getText(relKey: string): Promise<string | null> {
    try {
      return await fs.readFile(this.resolve(relKey), "utf-8");
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async head(relKey: string): Promise<ObjectHead | null> {
    try {
      const st = await fs.stat(this.resolve(relKey));
      return { lastModified: st.mtime, size: st.size };
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async putText(relKey: string, body: string): Promise<void> {
    const full = this.resolve(relKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body, "utf-8");
  }

  async deleteKey(relKey: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(relKey));
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  }

  async deletePrefix(relPrefix: string): Promise<void> {
    const base = this.resolve(relPrefix);
    try {
      await fs.rm(base, { recursive: true, force: true });
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  }

  async listAllKeys(): Promise<string[]> {
    const out: string[] = [];
    const walk = async (dir: string) => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          await walk(full);
        } else {
          const rel = path.relative(this.docsDir, full).replace(/\\/g, "/");
          if (rel && !rel.startsWith("..")) out.push(rel);
        }
      }
    };
    await walk(this.docsDir);
    return out.sort();
  }

  async copyKey(fromRel: string, toRel: string): Promise<void> {
    const from = this.resolve(fromRel);
    const to = this.resolve(toRel);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
  }

  async exists(relKey: string): Promise<boolean> {
    const h = await this.head(relKey);
    return h !== null;
  }

  async isFolder(relPath: string): Promise<boolean> {
    try {
      const st = await fs.stat(this.resolve(relPath));
      return st.isDirectory();
    } catch {
      return false;
    }
  }

  async createFolder(folderRelPath: string): Promise<void> {
    await fs.mkdir(this.resolve(folderRelPath), { recursive: true });
  }

  async ensureParentDirsForFile(fileRelKey: string): Promise<void> {
    const full = this.resolve(fileRelKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
  }

  async movePath(sourceRel: string, destRel: string): Promise<void> {
    const from = this.resolve(sourceRel);
    const to = this.resolve(destRel);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.rename(from, to);
  }
}
