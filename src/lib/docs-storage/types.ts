export interface ObjectHead {
  lastModified: Date;
  size: number;
}

/**
 * Storage for MDX and folder markers under `content/docs` (relative posix keys).
 */
export interface DocsStorage {
  getText(relKey: string): Promise<string | null>;
  head(relKey: string): Promise<ObjectHead | null>;
  putText(relKey: string, body: string): Promise<void>;
  deleteKey(relKey: string): Promise<void>;
  /** Deletes relPrefix exactly and every key starting with relPrefix + "/" */
  deletePrefix(relPrefix: string): Promise<void>;
  /** All object keys relative to docs root (posix), including .mdx and .keep */
  listAllKeys(): Promise<string[]>;
  copyKey(fromRel: string, toRel: string): Promise<void>;
  exists(relKey: string): Promise<boolean>;
  /** Directory on FS, or S3 prefix with .keep or child objects */
  isFolder(relPath: string): Promise<boolean>;
  /** FS: mkdir -p. S3: put folder/.keep */
  createFolder(folderRelPath: string): Promise<void>;
  /** FS: mkdir parent of file. S3: no-op */
  ensureParentDirsForFile(fileRelKey: string): Promise<void>;
  /** Move file or folder to a new relative path (FS: rename; S3: copy + delete). */
  movePath(sourceRel: string, destRel: string): Promise<void>;
}
