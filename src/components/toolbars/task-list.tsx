"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import { useToolbar } from "./toolbar-provider";

export const TaskListToolbar = () => {
  const { editor } = useToolbar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={
            editor.isActive("taskList")
              ? "bg-accent text-accent-foreground"
              : ""
          }
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Task List</p>
      </TooltipContent>
    </Tooltip>
  );
};
