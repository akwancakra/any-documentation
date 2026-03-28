/** Marker object for empty folders on S3 (no native directories). */
export const FOLDER_KEEP_NAME = ".keep";

export function normalizeDocRelKey(input: string): string {
  const s = input
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!s) {
    throw new Error("Invalid path: empty");
  }
  const segments = s.split("/");
  if (segments.some((p) => p === ".." || p === "")) {
    throw new Error("Invalid path: traversal or empty segment");
  }
  return s;
}

export function folderKeepRelKey(folderRelPath: string): string {
  const f = normalizeDocRelKey(folderRelPath);
  return `${f}/${FOLDER_KEEP_NAME}`;
}

export function isFolderKeepKey(relKey: string): boolean {
  return (
    relKey.endsWith(`/${FOLDER_KEEP_NAME}`) || relKey === FOLDER_KEEP_NAME
  );
}
