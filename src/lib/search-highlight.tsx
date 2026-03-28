import { Fragment, type ReactNode } from "react";

/** Low-contrast match highlight — visible but not loud. */
const SUBTLE_MARK =
  "rounded-[2px] bg-foreground/[0.07] px-px font-inherit text-inherit dark:bg-foreground/[0.11]";

/**
 * Wrap occurrences of query terms (≥2 chars, whitespace-split) in <mark>.
 */
export function highlightSearchTerms(
  text: string,
  query: string,
  markClassName: string = SUBTLE_MARK
): ReactNode {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (!text || terms.length === 0) return text;

  const escaped = terms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => part.toLowerCase() === t);
        return isMatch ? (
          <mark key={i} className={markClassName}>
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
