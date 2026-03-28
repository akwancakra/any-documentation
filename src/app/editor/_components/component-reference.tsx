"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid, Copy, Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MDXCodeEditorHandle } from "./mdx-code-editor";
import { useEditorSheetLayout } from "./use-editor-sheet-layout";

interface ComponentSnippet {
  name: string;
  description: string;
  snippet: string;
}

interface ComponentCategory {
  label: string;
  items: ComponentSnippet[];
}

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    label: "Content",
    items: [
      {
        name: "Callout - Info",
        description: "Blue info callout box",
        snippet: `<Callout type="info">
  Add important information here.
</Callout>`,
      },
      {
        name: "Callout - Warning",
        description: "Yellow warning callout box",
        snippet: `<Callout type="warn">
  Add your warning here.
</Callout>`,
      },
      {
        name: "Callout - Error",
        description: "Red error callout box",
        snippet: `<Callout type="error">
  Add your error message here.
</Callout>`,
      },
      {
        name: "Banner",
        description: "Announcement banner at the top of the page",
        snippet: `<Banner>
  Your announcement text here.
</Banner>`,
      },
    ],
  },
  {
    label: "Navigation & layout",
    items: [
      {
        name: "Tabs",
        description: "Selectable tab panels",
        snippet: `<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content for tab 1.
  </TabsContent>
  <TabsContent value="tab2">
    Content for tab 2.
  </TabsContent>
</Tabs>`,
      },
      {
        name: "Accordion",
        description: "Expandable / collapsible sections",
        snippet: `<Accordions type="single">
  <Accordion title="First question?">
    Answer to the first question.
  </Accordion>
  <Accordion title="Second question?">
    Answer to the second question.
  </Accordion>
</Accordions>`,
      },
      {
        name: "Steps",
        description: "Ordered step-by-step layout",
        snippet: `<Steps>
  <Step>
    ### Step 1

    Description for step 1.
  </Step>
  <Step>
    ### Step 2

    Description for step 2.
  </Step>
  <Step>
    ### Step 3

    Description for step 3.
  </Step>
</Steps>`,
      },
    ],
  },
  {
    label: "Cards",
    items: [
      {
        name: "Cards grid",
        description: "Grid of linked cards",
        snippet: `<Cards>
  <Card title="Card title" href="/docs/page">
    Short description for this card.
  </Card>
  <Card title="Second card" href="/docs/page-2">
    Short description for the second card.
  </Card>
</Cards>`,
      },
    ],
  },
  {
    label: "Code",
    items: [
      {
        name: "Code block",
        description: "Fenced code block with syntax highlighting",
        snippet:
          "```javascript\n// Your code here\nconsole.log('Hello world');\n```",
      },
      {
        name: "DynamicCodeBlock",
        description: "Fumadocs dynamic code block component",
        snippet: `<DynamicCodeBlock lang="javascript" code={\`console.log('Hello world');\`} />`,
      },
      {
        name: "Inline code",
        description: "Inline code in text",
        snippet: "`functionName()`",
      },
      {
        name: "InlineTOC",
        description: "Inline table of contents",
        snippet: `<InlineTOC />`,
      },
    ],
  },
  {
    label: "Media",
    items: [
      {
        name: "PDFViewer",
        description: "Embed a PDF file",
        snippet: `<PDFViewer src="/path/to/file.pdf" width="100%" height="500px" />`,
      },
      {
        name: "VideoViewer",
        description: "Embed a video",
        snippet: `<VideoViewer src="/path/to/video.mp4" width="100%" height="400px" />`,
      },
      {
        name: "Image",
        description: "Markdown image with alt text",
        snippet: `![Image description](/path/to/image.png)`,
      },
    ],
  },
  {
    label: "Text & format",
    items: [
      {
        name: "Heading H2",
        description: "Level 2 section heading",
        snippet: `## Section title`,
      },
      {
        name: "Heading H3",
        description: "Level 3 subheading",
        snippet: `### Subsection title`,
      },
      {
        name: "Table",
        description: "Markdown table",
        snippet: `| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |`,
      },
      {
        name: "Blockquote",
        description: "Quoted text",
        snippet: `> Your quote or important note here.`,
      },
    ],
  },
];

interface ComponentCardProps {
  item: ComponentSnippet;
  onInsert: (snippet: string) => void;
}

function ComponentCard({ item, onInsert }: ComponentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {item.description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            title="Copy snippet"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => onInsert(item.snippet)}
            title="Insert into editor at cursor"
          >
            <PlusCircle className="h-3 w-3" />
            Insert
          </Button>
        </div>
      </div>
      <pre className="text-[11px] bg-muted rounded px-3 py-2 overflow-x-auto max-h-36 text-muted-foreground leading-relaxed whitespace-pre">
        <code>{item.snippet}</code>
      </pre>
    </div>
  );
}

interface ComponentReferenceProps {
  editorRef: React.RefObject<MDXCodeEditorHandle | null>;
}

export function ComponentReference({ editorRef }: ComponentReferenceProps) {
  const { sheetSide } = useEditorSheetLayout();

  const handleInsert = (snippet: string) => {
    editorRef.current?.insertText(snippet);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="MDX component reference"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden lg:inline">Components</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side={sheetSide}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          sheetSide === "bottom"
            ? "h-[88dvh] max-h-[88dvh] w-full rounded-t-xl"
            : cn(
                "h-full",
                "md:w-[min(44rem,92vw)] md:max-w-[92vw]",
                "lg:w-[min(44rem,50vw)] lg:max-w-[50vw]",
              ),
        )}
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0 text-left">
          <SheetTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            MDX component reference
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Click <strong>Insert</strong> to paste a snippet at the cursor, or{" "}
            <strong>Copy</strong> to copy it.
          </p>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 h-0">
          <div className="px-4 py-4 space-y-6">
            {COMPONENT_CATEGORIES.map((category) => (
              <div key={category.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {category.label}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <ComponentCard
                      key={item.name}
                      item={item}
                      onInsert={handleInsert}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
