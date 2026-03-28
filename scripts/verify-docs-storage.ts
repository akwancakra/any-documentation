/**
 * Smoke check untuk normalisasi path docs (tanpa AWS).
 * Jalankan: npx tsx scripts/verify-docs-storage.ts
 */
import {
  normalizeDocRelKey,
  isFolderKeepKey,
  folderKeepRelKey,
} from "../src/lib/docs-storage/keys";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

assert(isFolderKeepKey("guide/.keep"), "folder keep key");
assert(!isFolderKeepKey("guide/page.mdx"), "mdx not keep");
assert(folderKeepRelKey("a/b") === "a/b/.keep", "folderKeepRelKey");

try {
  normalizeDocRelKey("../evil");
  assert(false, "should reject ..");
} catch {
  /* ok */
}

assert(normalizeDocRelKey("foo/bar.mdx") === "foo/bar.mdx", "posix path");

console.log("verify-docs-storage: OK");
