"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Editor } from "@tiptap/react";

interface Heading {
  id: string;
  level: number;
  text: string;
}

export function TableOfContents({ editor }: { editor: Editor }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Extract headings from editor content
  const extractHeadings = useCallback(() => {
    if (!editor) return;

    const headingNodes: Heading[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const id = `heading-${pos}`;
        const level = node.attrs.level;
        const text = node.textContent;

        headingNodes.push({
          id,
          level,
          text,
        });
      }
    });

    setHeadings(headingNodes);
  }, [editor]);

  // Update headings when content changes
  useEffect(() => {
    if (!editor) return;

    extractHeadings();

    editor.on("update", extractHeadings);

    return () => {
      editor.off("update", extractHeadings);
    };
  }, [editor, extractHeadings]);

  // Scroll to heading when clicked
  const scrollToHeading = (id: string) => {
    const headingPos = parseInt(id.replace("heading-", ""));
    const view = editor.view;

    const domPos = view.domAtPos(headingPos);
    if (!domPos?.node) return;

    // Find the heading element
    let element = domPos.node as HTMLElement;
    while (element && !["H1", "H2", "H3", "H4"].includes(element.tagName)) {
      if (element.parentElement) {
        element = element.parentElement;
      } else {
        break;
      }
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  return (
    <div className="w-full h-full border-l border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-sm">Table of Contents</h3>
      </div>
      <ScrollArea className="h-[calc(100%-53px)]">
        <div className="p-4">
          {headings.length > 0 ? (
            <div className="flex flex-col gap-2">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`text-left text-sm hover:text-primary transition-colors ${
                    activeId === heading.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  } ${
                    heading.level === 1
                      ? ""
                      : heading.level === 2
                      ? "pl-3"
                      : heading.level === 3
                      ? "pl-6"
                      : "pl-9"
                  }`}
                >
                  {heading.text}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No headings found in document
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
