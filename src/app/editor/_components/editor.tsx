"use client";

import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BlockquoteToolbar } from "@/components/toolbars/blockquote";
import { BoldToolbar } from "@/components/toolbars/bold";
import { BulletListToolbar } from "@/components/toolbars/bullet-list";
import { CodeToolbar } from "@/components/toolbars/code";
import { CodeBlockToolbar } from "@/components/toolbars/code-block";
import { HardBreakToolbar } from "@/components/toolbars/hard-break";
import { HorizontalRuleToolbar } from "@/components/toolbars/horizontal-rule";
import { ItalicToolbar } from "@/components/toolbars/italic";
import { OrderedListToolbar } from "@/components/toolbars/ordered-list";
import { StrikeThroughToolbar } from "@/components/toolbars/strikethrough";
import { ToolbarProvider } from "@/components/toolbars/toolbar-provider";
import { RedoToolbar } from "@/components/toolbars/redo";
import { UndoToolbar } from "@/components/toolbars/undo";
import { TextAlignToolbar } from "@/components/toolbars/text-align";
import { LinkToolbar } from "@/components/toolbars/link";
import { TableToolbar } from "@/components/toolbars/table";
import { CalloutToolbar } from "@/components/toolbars/callout";
import { TaskListToolbar } from "@/components/toolbars/task-list";
import { EditorContent, type Extension, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Type, Eye, Save, ChevronDown, ArrowLeft } from "lucide-react";
import SearchAndReplace from "@/components/extensions/search-and-replace";
import { SearchAndReplaceToolbar } from "@/components/toolbars/search-and-replace-toolbar";
import { ImageExtension } from "@/components/extensions/image";
import { ImagePlaceholder } from "@/components/extensions/image-placeholder";
import { ImagePlaceholderToolbar } from "@/components/toolbars/image-placeholder-toolbar";
import { ColorHighlightToolbar } from "@/components/toolbars/color-and-highlight";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { CalloutExtension } from "@/components/extensions/callout";
import { TableOfContents } from "@/app/editor/_components/table-of-contents";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import { ToastProvider, useToast } from "@/components/ui/use-toast";
import { SaveDialog } from "@/app/editor/_components/save-dialog";

// Import ekstensi kustom
import {
  AccordionExtension,
  AccordionItemExtension,
} from "@/components/extensions/accordion";
import { CardsExtension, CardExtension } from "@/components/extensions/cards";
import {
  TabsExtension,
  TabsListExtension,
  TabsTriggerExtension,
  TabsContentExtension,
} from "@/components/extensions/tabs";
import { PDFViewerExtension } from "@/components/extensions/pdf-viewer";
import { PDFViewerToolbar } from "@/components/toolbars/pdf-viewer-toolbar";
import { VideoViewerExtension } from "@/components/extensions/video-viewer";
import { VideoViewerToolbar } from "@/components/toolbars/video-viewer-toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom heading toolbar component
const HeadingToolbar = ({ editor }: { editor: Editor }) => {
  const currentLevel = editor.getAttributes("heading").level || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Type className="h-4 w-4" />
          {currentLevel > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              H{currentLevel}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={!currentLevel ? "bg-accent" : ""}
        >
          Normal Text
        </DropdownMenuItem>
        {([1, 2, 3, 4] as const).map((level) => (
          <DropdownMenuItem
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            className={currentLevel === level ? "bg-accent" : ""}
          >
            <p className="text-sm font-semibold">Heading {level}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// New components for extended toolbars
const TabsToolbar = ({ editor }: { editor: Editor }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "tabs-container",
            content: [
              {
                type: "tabs-list",
                content: [
                  {
                    type: "tabs-trigger",
                    attrs: { value: "tab1" },
                    content: [{ type: "text", text: "Tab 1" }],
                  },
                  {
                    type: "tabs-trigger",
                    attrs: { value: "tab2" },
                    content: [{ type: "text", text: "Tab 2" }],
                  },
                ],
              },
              {
                type: "tabs-content",
                attrs: { value: "tab1" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Tab 1 content" }],
                  },
                ],
              },
              {
                type: "tabs-content",
                attrs: { value: "tab2" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Tab 2 content" }],
                  },
                ],
              },
            ],
          })
          .run();
      }}
      className="h-8 px-2 flex items-center gap-1"
    >
      <div className="flex h-4 w-4 border-t border-l border-r rounded-t-sm"></div>
      <span className="text-xs">Tabs</span>
    </Button>
  );
};

const AccordionToolbar = ({ editor }: { editor: Editor }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "accordion-container",
            attrs: { type: "single" },
            content: [
              {
                type: "accordion-item",
                attrs: { title: "Click to expand" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Hidden content here" }],
                  },
                ],
              },
            ],
          })
          .run();
      }}
      className="h-8 px-2 flex items-center gap-1"
    >
      <ChevronDown className="h-4 w-4" />
      <span className="text-xs">Accordion</span>
    </Button>
  );
};

const CardsToolbar = ({ editor }: { editor: Editor }) => {
  const insertSingleCard = () => {
    const card = {
      type: "card",
      attrs: {
        title: "Card Title",
        href: "#",
      },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Description for this card." }],
        },
      ],
    };

    editor
      .chain()
      .focus()
      .insertContent({
        type: "cards",
        content: [card],
      })
      .run();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 flex items-center gap-1"
      onClick={insertSingleCard}
    >
      <div className="h-4 w-4 border rounded"></div>
      <span className="text-xs">Card</span>
    </Button>
  );
};

const extensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal ml-6 space-y-1",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc ml-6 space-y-1",
      },
    },
    code: {
      HTMLAttributes: {
        class:
          "bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-sm font-mono",
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: "my-6 border-border",
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class:
          "bg-muted text-muted-foreground p-4 text-sm rounded-lg font-mono my-4 overflow-x-auto",
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
      HTMLAttributes: {
        class: "tiptap-heading font-semibold tracking-tight",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class:
          "border-l-4 border-muted-foreground/25 pl-4 italic text-muted-foreground my-4",
      },
    },
    paragraph: {
      HTMLAttributes: {
        class: "leading-7",
      },
    },
  }),
  SearchAndReplace,
  ImageExtension,
  ImagePlaceholder,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-primary underline decoration-primary underline-offset-4",
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class:
        "border-collapse border border-border rounded-lg overflow-hidden my-6 w-full",
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: "border-b border-border last:border-b-0",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class:
        "bg-muted/50 font-semibold text-left p-3 border-r border-border last:border-r-0 text-sm",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "p-3 border-r border-border last:border-r-0 text-sm",
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "task-list space-y-2 my-4",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "task-item flex items-start gap-2",
    },
    nested: true,
  }),
  CalloutExtension,
  AccordionItemExtension,
  AccordionExtension,
  CardsExtension,
  CardExtension,
  TabsExtension,
  TabsListExtension,
  TabsTriggerExtension,
  TabsContentExtension,
  PDFViewerExtension,
  VideoViewerExtension,
];

const content = `
<p>Start editing to explore all the new features! ✨</p>
`;

interface EditModeData {
  content: string;
  metadata: {
    title?: string;
    description?: string;
  };
  filePath: string;
}

interface EnhancedDocumentationEditorProps {
  editMode?: EditModeData;
}

const EnhancedDocumentationEditor = ({
  editMode,
}: EnhancedDocumentationEditorProps) => {
  const [isPreview, setIsPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [fileName, setFileName] = useState(
    editMode?.filePath?.replace(/\.mdx$/, "") || "document"
  );
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  // Convert MDX content to HTML for the editor
  const convertMDXToHTML = (mdxContent: string): string => {
    if (!mdxContent) return content;

    // Basic MDX to HTML conversion for the editor
    let htmlContent: string = mdxContent
      // Convert headings
      .replace(/^# (.+)$/gm, '<h1 class="tiptap-heading">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="tiptap-heading">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="tiptap-heading">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="tiptap-heading">$1</h4>')

      // Convert Callouts
      .replace(
        /<Callout type="([^"]+)">\s*([\s\S]*?)\s*<\/Callout>/g,
        '<div data-type="callout" data-callout-type="$1">$2</div>'
      )

      // Convert Tabs
      .replace(
        /<Tabs defaultValue="([^"]+)">\s*<TabsList>\s*([\s\S]*?)\s*<\/TabsList>\s*([\s\S]*?)\s*<\/Tabs>/g,
        (match, defaultValue, tabsList, tabsContent) => {
          // Extract triggers
          const triggers =
            tabsList.match(
              /<TabsTrigger value="([^"]+)">([^<]+)<\/TabsTrigger>/g
            ) || [];
          const contents =
            tabsContent.match(
              /<TabsContent value="([^"]+)">([^<]*)<\/TabsContent>/g
            ) || [];

          let tabsHTML = '<div data-type="tabs-container">';
          tabsHTML += '<div data-type="tabs-list">';

          triggers.forEach((trigger: string) => {
            const triggerMatch = trigger.match(
              /<TabsTrigger value="([^"]+)">([^<]+)<\/TabsTrigger>/
            );
            if (triggerMatch) {
              tabsHTML += `<div data-type="tabs-trigger" data-value="${triggerMatch[1]}">${triggerMatch[2]}</div>`;
            }
          });

          tabsHTML += "</div>";

          contents.forEach((content: string) => {
            const contentMatch = content.match(
              /<TabsContent value="([^"]+)">([^<]*)<\/TabsContent>/
            );
            if (contentMatch) {
              tabsHTML += `<div data-type="tabs-content" data-value="${contentMatch[1]}"><p>${contentMatch[2]}</p></div>`;
            }
          });

          tabsHTML += "</div>";
          return tabsHTML;
        }
      )

      // Convert Accordions
      .replace(
        /<Accordions type="([^"]+)">\s*([\s\S]*?)\s*<\/Accordions>/g,
        (match, type, accordionContent) => {
          const accordions =
            accordionContent.match(
              /<Accordion title="([^"]+)">([^<]*)<\/Accordion>/g
            ) || [];

          let accordionsHTML = `<div data-type="accordion-container" data-accordion-type="${type}">`;

          accordions.forEach((accordion: string) => {
            const accordionMatch = accordion.match(
              /<Accordion title="([^"]+)">([^<]*)<\/Accordion>/
            );
            if (accordionMatch) {
              accordionsHTML += `<div data-type="accordion-item" data-title="${accordionMatch[1]}"><p>${accordionMatch[2]}</p></div>`;
            }
          });

          accordionsHTML += "</div>";
          return accordionsHTML;
        }
      )

      // Convert Cards
      .replace(/<Cards>\s*([\s\S]*?)\s*<\/Cards>/g, (match, cardsContent) => {
        const cards = cardsContent.match(/<Card[^>]*>[\s\S]*?<\/Card>/g) || [];

        let cardsHTML = '<div data-type="cards">';

        cards.forEach((card: string) => {
          const titleMatch = card.match(/title="([^"]+)"/);
          const hrefMatch = card.match(/href="([^"]+)"/);
          const contentMatch = card.match(/<Card[^>]*>([\s\S]*?)<\/Card>/);

          const title = titleMatch ? titleMatch[1] : "Card Title";
          const href = hrefMatch ? hrefMatch[1] : "#";
          const cardContent = contentMatch ? contentMatch[1].trim() : "";

          cardsHTML += `<div data-type="card" data-title="${title}" data-href="${href}">`;
          if (cardContent) {
            cardsHTML += `<p>${cardContent}</p>`;
          }
          cardsHTML += "</div>";
        });

        cardsHTML += "</div>";
        return cardsHTML;
      })

      // Convert PDF Viewer
      .replace(
        /<PDFViewer\s+src="([^"]+)"\s*(?:width="([^"]+)")?\s*(?:height="([^"]+)")?\s*\/>/g,
        '<div data-type="pdf-viewer" data-src="$1" data-width="$2" data-height="$3"></div>'
      )

      // Convert Video Viewer
      .replace(
        /<VideoViewer\s+src="([^"]+)"\s*(?:width="([^"]+)")?\s*(?:height="([^"]+)")?\s*\/>/g,
        '<div data-type="video-viewer" data-src="$1" data-width="$2" data-height="$3"></div>'
      )

      // Convert markdown tables to HTML tables
      .replace(
        /^\|(.+)\|\s*\n\|[-\s|:]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm,
        (match: string, header: string, rows: string) => {
          // Process header
          const headerCells = header
            .split("|")
            .map((cell: string) => cell.trim())
            .filter((cell: string) => cell);

          // Process rows
          const rowLines = rows
            .trim()
            .split("\n")
            .filter((line: string) => line.trim());
          const bodyRows = rowLines.map((row: string) => {
            return row
              .split("|")
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell);
          });

          let tableHTML = "<table><thead><tr>";
          headerCells.forEach((cell: string) => {
            tableHTML += `<th>${cell}</th>`;
          });
          tableHTML += "</tr></thead><tbody>";

          bodyRows.forEach((row: string[]) => {
            tableHTML += "<tr>";
            row.forEach((cell: string) => {
              tableHTML += `<td>${cell}</td>`;
            });
            tableHTML += "</tr>";
          });

          tableHTML += "</tbody></table>";
          return tableHTML;
        }
      )

      // Convert code blocks
      .replace(
        /```(\w+)?\s*(?:title="([^"]+)")?\s*\n([\s\S]*?)\n```/g,
        '<pre><code data-language="$1" data-title="$2">$3</code></pre>'
      )

      // Convert inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")

      // Convert basic formatting
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")

      // Convert links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

      // Convert images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

      // Convert bullet lists
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")

      // Convert numbered lists
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ol>$1</ol>")

      // Convert paragraphs (but not for elements that are already wrapped)
      .replace(/^(?!<[h1-6]|<div|<ul|<ol|<table|<pre)(.+)$/gm, "<p>$1</p>")

      // Clean up extra newlines
      .replace(/\n\n+/g, "\n")
      .replace(/\n/g, "");

    return htmlContent;
  };

  const initialContent = editMode
    ? convertMDXToHTML(editMode.content)
    : content;

  const editor = useEditor({
    extensions: extensions as Extension[],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length);
    },
  });

  // Calculate word count when editor first loads
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length);
    }
  }, [editor]);

  // Function to convert editor content to MDX format
  const convertToMDX = () => {
    if (!editor) return "";

    // Get JSON content from the editor for better structure handling
    const json = editor.getJSON();

    // Convert JSON to MDX format
    let mdx = "";

    // Process JSON content recursively
    const processNode = (node: any): string => {
      if (!node) return "";

      switch (node.type) {
        case "doc":
          return node.content?.map(processNode).join("\n\n") || "";

        case "paragraph":
          return node.content?.map(processNode).join("") || "";

        case "text":
          let text = node.text || "";

          // Handle text formatting marks
          if (node.marks) {
            for (const mark of node.marks) {
              switch (mark.type) {
                case "bold":
                  text = `**${text}**`;
                  break;
                case "italic":
                  text = `*${text}*`;
                  break;
                case "code":
                  text = `\`${text}\``;
                  break;
                case "strike":
                  text = `~~${text}~~`;
                  break;
                case "link":
                  const href = mark.attrs?.href || "#";
                  text = `[${text}](${href})`;
                  break;
                case "highlight":
                  // You can add highlight handling here if needed
                  break;
              }
            }
          }

          return text;

        case "heading":
          const level = "#".repeat(node.attrs.level);
          return `${level} ${node.content?.map(processNode).join("") || ""}`;

        case "callout":
          const calloutType = node.attrs.type || "info";
          return `<Callout type="${calloutType}">\n${
            node.content?.map(processNode).join("\n") || ""
          }\n</Callout>`;

        case "tabs-container":
          const tabsList = node.content?.find(
            (child: any) => child.type === "tabs-list"
          );
          const tabsContents = node.content?.filter(
            (child: any) => child.type === "tabs-content"
          );

          const triggers =
            tabsList?.content
              ?.map((trigger: any) => {
                const value = trigger.attrs?.value || "tab";
                const text = trigger.content?.map(processNode).join("") || "";
                return `<TabsTrigger value="${value}">${text}</TabsTrigger>`;
              })
              .join("\n            ") || "";

          const contents =
            tabsContents
              ?.map((content: any) => {
                const value = content.attrs?.value || "tab";
                const contentText =
                  content.content?.map(processNode).join("\n\n") || "";
                return `<TabsContent value="${value}">
${contentText}
</TabsContent>`;
              })
              .join("\n            ") || "";

          return `<Tabs defaultValue="${
            tabsList?.content?.[0]?.attrs?.value || "tab1"
          }">
          <TabsList>
            ${triggers}
          </TabsList>
${contents}
        </Tabs>`;

        case "accordion-container":
          const accordionItems =
            node.content
              ?.map((item: any) => {
                if (item.type !== "accordion-item") return null;

                const title = item.attrs.title || "Accordion Title";
                const itemContent = item.content?.map(processNode).join("\n\n");

                return `<Accordion title="${title}">
${itemContent}
</Accordion>`;
              })
              .filter(Boolean)
              .join("\n          ") || "";

          return `<Accordions type="${node.attrs.type || "single"}">
          ${accordionItems}
        </Accordions>`;

        case "cards":
          return `<Cards>\n${
            node.content?.map(processNode).join("\n") || ""
          }\n</Cards>`;

        case "card":
          const href = node.attrs.href || "#";
          const cardTitle = node.attrs.title || "Card Title";
          return `<Card title="${cardTitle}" href="${href}">\n${
            node.content?.map(processNode).join("\n") || ""
          }\n</Card>`;

        case "codeBlock":
          const language = node.attrs.language || "";
          const title = node.attrs["data-title"]
            ? ` title="${node.attrs["data-title"]}"`
            : "";
          return `\`\`\`${language}${title}\n${
            node.content?.map(processNode).join("") || ""
          }\n\`\`\``;

        case "bulletList":
          return (
            node.content
              ?.map((item: any) => `- ${processNode(item)}`)
              .join("\n") || ""
          );

        case "orderedList":
          return (
            node.content
              ?.map(
                (item: any, index: number) =>
                  `${index + 1}. ${processNode(item)}`
              )
              .join("\n") || ""
          );

        case "listItem":
          return node.content?.map(processNode).join("") || "";

        case "table":
          // Convert table node to MDX
          let tableContent = "";
          if (node.content) {
            // Header row
            const headerRow = node.content[0];
            if (headerRow && headerRow.content) {
              tableContent += "| ";
              headerRow.content.forEach((cell: any) => {
                tableContent += `${processNode(cell)} | `;
              });
              tableContent += "\n| ";
              headerRow.content.forEach(() => {
                tableContent += "--- | ";
              });
              tableContent += "\n";
            }

            // Data rows
            for (let i = 1; i < node.content.length; i++) {
              const row = node.content[i];
              if (row && row.content) {
                tableContent += "| ";
                row.content.forEach((cell: any) => {
                  tableContent += `${processNode(cell)} | `;
                });
                tableContent += "\n";
              }
            }
          }
          return tableContent;

        case "tableRow":
        case "tableCell":
        case "tableHeader":
          return node.content?.map(processNode).join("") || "";

        case "image":
          const src = node.attrs.src || "";
          const alt = node.attrs.alt || "Image";
          return `![${alt}](${src})`;

        case "pdf-viewer":
          const pdfSrc = node.attrs.src || "";
          const pdfWidth = node.attrs.width || "100%";
          const pdfHeight = node.attrs.height || "500px";
          return `<PDFViewer src="${pdfSrc}" width="${pdfWidth}" height="${pdfHeight}" />`;

        case "video-viewer":
          const videoSrc = node.attrs.src || "";
          const videoWidth = node.attrs.width || "100%";
          const videoHeight = node.attrs.height || "500px";
          return `<VideoViewer src="${videoSrc}" width="${videoWidth}" height="${videoHeight}" />`;

        default:
          return node.content?.map(processNode).join("") || "";
      }
    };

    mdx = processNode(json);

    // Return only the content without frontmatter (API will add frontmatter)
    return mdx;
  };

  // Function to save content as MDX file
  const handleSave = async (
    filePath: string,
    metadata: { title: string; description: string }
  ) => {
    if (!editor) return;

    const mdxContent = convertToMDX();

    try {
      const response = await fetch("/api/save-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          content: mdxContent,
          metadata,
          isUpdate: !!editMode, // Pass isUpdate flag if in edit mode
          originalPath: editMode?.filePath, // Pass original path for update mode
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save file.");
      }

      // Force revalidation to ensure changes are visible
      try {
        const urlPath = filePath.replace(/\.mdx$/, "");
        await fetch("/api/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: `/docs/${urlPath}`,
          }),
        });
      } catch (revalidateError) {
        console.warn("Revalidation failed:", revalidateError);
      }

      const successMessage = editMode
        ? "File updated successfully!"
        : "File saved successfully!";
      const actionText = editMode ? "View Updated File" : "View File";

      if (editMode) {
        // For edit mode, redirect to the updated docs page
        toast({
          title: "Success!",
          description: "File updated! Redirecting to view changes...",
        });

        const urlPath = filePath.replace(/\.mdx$/, "");
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          redirectTimeoutRef.current = null;
          window.location.href = `/docs/${urlPath}`;
        }, 1000);
      } else {
        // For new files, show success with action button
        toast({
          title: "Success!",
          description: `${successMessage} at: ${filePath}`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Redirect to the file directly from the button
                const urlPath = filePath.replace(/\.mdx$/, "");
                window.location.href = `/docs/${urlPath}`;
              }}
            >
              {actionText}
            </Button>
          ),
        });

        const urlPath = filePath.replace(/\.mdx$/, "");
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          redirectTimeoutRef.current = null;
          window.location.href = `/docs/${urlPath}`;
        }, 1000);
      }

      // Update filename state with the saved file
      setFileName(filePath);
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred.";

      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: errorMessage,
      });
      // Re-throw to be caught in dialog
      throw error;
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <>
      <SaveDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSave}
        initialFileName={fileName}
        initialTitle={editMode?.metadata?.title || ""}
        initialDescription={editMode?.metadata?.description || ""}
        editMode={editMode}
      />
      <div className="flex h-screen bg-background flex-col border-l">
        {/* Header */}
        <header className="items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 space-y-2 sm:space-y-0 sm:flex">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="font-semibold text-base">
              {editMode
                ? `Editing: ${editMode.metadata?.title || fileName}`
                : "Create New Document"}
            </h1>
          </div>
          <div className="flex items-center justify-end gap-2 sm:justify-start">
            <Badge variant="secondary" className="text-xs">
              {wordCount} words
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {isPreview ? "Edit" : "Preview"}
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              {editMode ? "Update" : "Save"}
            </Button>
          </div>
        </header>

        {/* Toolbar */}
        {!isPreview && (
          <div className="border-b bg-muted/30 p-2 overflow-x-auto">
            <ToolbarProvider editor={editor}>
              <div className="flex items-center justify-between gap-4 min-w-[320px]">
                {/* Left toolbar */}
                <ScrollArea className="flex-1 whitespace-nowrap min-w-0">
                  <div className="flex items-center gap-1 pb-2.5">
                    {/* History */}
                    <div className="flex items-center gap-1">
                      <UndoToolbar />
                      <RedoToolbar />
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Text Formatting */}
                    <div className="flex items-center gap-1">
                      <HeadingToolbar editor={editor} />
                      <BoldToolbar />
                      <ItalicToolbar />
                      <StrikeThroughToolbar />
                      <CodeToolbar />
                      <LinkToolbar />
                      <ColorHighlightToolbar />
                      <TextAlignToolbar />
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Lists and Structure */}
                    <div className="flex items-center gap-1">
                      <BulletListToolbar />
                      <OrderedListToolbar />
                      <TaskListToolbar />
                      <BlockquoteToolbar />
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Insert Elements */}
                    <div className="flex items-center gap-1">
                      <TableToolbar />
                      <CalloutToolbar />
                      <CodeBlockToolbar />
                      <HorizontalRuleToolbar />
                      <HardBreakToolbar />
                      <ImagePlaceholderToolbar />
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Fumadocs Components */}
                    <div className="flex items-center gap-1">
                      <CardsToolbar editor={editor} />
                      <PDFViewerToolbar />
                      <VideoViewerToolbar />
                    </div>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Right toolbar */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <SearchAndReplaceToolbar />
                </div>
              </div>
            </ToolbarProvider>
          </div>
        )}

        {/* Editor Content with Table of Contents */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Content */}
          <div className="w-full md:w-3/4 lg:w-4/5 flex-shrink-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div
                onClick={() => {
                  if (!isPreview) {
                    editor?.chain().focus().run();
                  }
                }}
                className={`${
                  isPreview ? "" : "cursor-text"
                } min-h-full py-4 px-2 sm:px-4 md:px-8 max-w-full md:max-w-3xl mx-auto`}
              >
                <div
                  className={`prose prose-slate dark:prose-invert max-w-none ${
                    isPreview ? "prose-lg" : ""
                  }`}
                >
                  <EditorContent
                    className={`outline-none ${
                      isPreview ? "pointer-events-none" : ""
                    }`}
                    editor={editor}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Table of Contents - responsive: hidden on mobile, visible on md+ */}
          <div className="hidden md:block md:w-1/4 lg:w-1/5 border-l border-border bg-background/80 overflow-y-auto">
            <TableOfContents editor={editor} />
          </div>
        </div>
      </div>
    </>
  );
};

const EditorWithToast = ({ editMode }: EnhancedDocumentationEditorProps) => (
  <ToastProvider>
    <EnhancedDocumentationEditor editMode={editMode} />
  </ToastProvider>
);

export default EditorWithToast;
export { EnhancedDocumentationEditor };
