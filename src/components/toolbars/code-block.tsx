"use client";

import { Code } from "lucide-react";
import React, { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToolbar } from "@/components/toolbars/toolbar-provider";

const CodeBlockToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const [open, setOpen] = useState(false);
    const [language, setLanguage] = useState("js");
    const [title, setTitle] = useState("");

    const insertFormattedCodeBlock = () => {
      if (!editor) return;

      // Insert a code block with the specified language and title
      editor.chain().focus().toggleCodeBlock({ language }).run();

      // If a title was provided, we need to store it as a data attribute
      if (title && editor.isActive("codeBlock")) {
        // Find the code block node we just created
        const codeBlockPos = editor.state.selection.$head.before();
        const codeBlockNode = editor.state.doc.nodeAt(codeBlockPos);

        if (codeBlockNode && codeBlockNode.type.name === "codeBlock") {
          // Update the attributes to include title
          editor
            .chain()
            .focus()
            .updateAttributes("codeBlock", {
              "data-title": title,
            })
            .run();
        }
      }

      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  editor?.isActive("codeBlock") && "bg-accent",
                  className
                )}
                ref={ref}
                {...props}
              >
                {children || <Code className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <span>Code Block</span>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-72">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Insert Code Block</h4>
              <p className="text-sm text-muted-foreground">
                Configure your code block
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="col-span-2 h-8">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="js">JavaScript</SelectItem>
                    <SelectItem value="ts">TypeScript</SelectItem>
                    <SelectItem value="jsx">JSX</SelectItem>
                    <SelectItem value="tsx">TSX</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="yml">YAML</SelectItem>
                    <SelectItem value="md">Markdown</SelectItem>
                    <SelectItem value="bash">Bash</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="cs">C#</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-2 h-8"
                  placeholder="File name or title"
                />
              </div>
            </div>
            <Button size="sm" onClick={insertFormattedCodeBlock}>
              Insert
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

CodeBlockToolbar.displayName = "CodeBlockToolbar";

export { CodeBlockToolbar };
