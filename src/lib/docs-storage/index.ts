import path from "path";
import type { DocsStorage } from "./types";
import { FsDocsStorage } from "./fs-storage";
import { S3DocsStorage } from "./s3-storage";

export type { DocsStorage, ObjectHead } from "./types";
export { FsDocsStorage } from "./fs-storage";
export { S3DocsStorage } from "./s3-storage";
export * from "./keys";

let cached: DocsStorage | null = null;

export function createDocsStorage(): DocsStorage {
  const mode = (process.env.DOCS_STORAGE ?? "fs").toLowerCase();
  if (mode === "s3") {
    const bucket = process.env.DOCS_S3_BUCKET;
    if (!bucket) {
      throw new Error(
        "DOCS_S3_BUCKET is required when DOCS_STORAGE=s3",
      );
    }
    return new S3DocsStorage({
      bucket,
      prefix: process.env.DOCS_S3_PREFIX ?? "",
      region: process.env.AWS_REGION,
    });
  }
  return new FsDocsStorage(
    path.resolve(process.cwd(), "content", "docs"),
  );
}

/** Singleton for server runtime (avoid recreating S3 client per request). */
export function getDocsStorage(): DocsStorage {
  if (!cached) {
    cached = createDocsStorage();
  }
  return cached;
}

/** Test / scripts only */
export function resetDocsStorageCache(): void {
  cached = null;
}
