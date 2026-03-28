/**
 * Parse title and description from YAML frontmatter (quoted string values).
 * Used by split-view editor and MDX preview to match /docs page shell.
 */
export function extractFrontmatterMeta(content: string): {
  title: string;
  description: string;
} {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { title: "", description: "" };
  }

  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/title:\s*["']([^"']+)["']/);
  const descriptionMatch = frontmatter.match(
    /description:\s*["']([^"']+)["']/,
  );

  return {
    title: titleMatch ? titleMatch[1] : "",
    description: descriptionMatch ? descriptionMatch[1] : "",
  };
}
