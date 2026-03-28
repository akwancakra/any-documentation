"use client";

import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "@/components/toolbars/toolbar-provider";

type TextAlignOption = "left" | "center" | "right" | "justify";

const alignIcons = {
  left: <AlignLeft className="h-4 w-4" />,
  center: <AlignCenter className="h-4 w-4" />,
  right: <AlignRight className="h-4 w-4" />,
  justify: <AlignJustify className="h-4 w-4" />,
};

const alignLabels = {
  left: "Justify Left",
  center: "Justify Center",
  right: "Justify Right",
  justify: "Justify Full",
};

const TextAlignToolbar = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, children, ...props }, ref) => {
  const { editor } = useToolbar();
  const [currentAlign, setCurrentAlign] =
    React.useState<TextAlignOption>("left");

  // Cek alignment aktif saat ini
  React.useEffect(() => {
    if (editor) {
      const alignOptions: TextAlignOption[] = [
        "left",
        "center",
        "right",
        "justify",
      ];
      const active = alignOptions.find((align) =>
        editor.isActive({ textAlign: align })
      );
      if (active) {
        setCurrentAlign(active);
      }
    }
  }, [editor]);

  const handleAlignChange = (align: TextAlignOption) => {
    if (editor) {
      editor.chain().focus().setTextAlign(align).run();
      setCurrentAlign(align);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", className)}
              ref={ref}
              {...props}
            >
              {alignIcons[currentAlign]}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Justify Text</span>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        {(Object.keys(alignIcons) as TextAlignOption[]).map((align) => (
          <DropdownMenuItem
            key={align}
            onClick={() => handleAlignChange(align)}
            className={currentAlign === align ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2">
              {alignIcons[align]}
              <span>{alignLabels[align]}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TextAlignToolbar.displayName = "TextAlignToolbar";

export { TextAlignToolbar };
