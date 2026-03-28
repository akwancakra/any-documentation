"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageIcon } from "lucide-react";
import { useToolbar } from "./toolbar-provider";

export const ImagePlaceholderToolbar = () => {
  const { editor } = useToolbar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 flex items-center gap-1"
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertImagePlaceholder().run();
            }
          }}
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs">Image</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Insert Image</p>
      </TooltipContent>
    </Tooltip>
  );
};
