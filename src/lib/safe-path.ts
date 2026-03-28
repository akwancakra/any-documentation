import path from "path";

/**
 * Resolves userPath under baseDir and returns null if the result escapes baseDir (path traversal).
 */
export function safeResolvePath(
  baseDir: string,
  userPath: string
): string | null {
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, userPath);
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    return null;
  }
  return resolved;
}
