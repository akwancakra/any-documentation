"use client";

import { Table, Plus, Minus, Trash2, Grid } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "@/components/toolbars/toolbar-provider";

export function TableToolbar() {
  const { editor } = useToolbar();
  const [isOpen, setIsOpen] = useState(false);

  const isTableActive = editor?.isActive("table");

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
    setIsOpen(false);
  };

  const addColumnBefore = () => {
    editor?.chain().focus().addColumnBefore().run();
  };

  const addColumnAfter = () => {
    editor?.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor?.chain().focus().deleteColumn().run();
  };

  const addRowBefore = () => {
    editor?.chain().focus().addRowBefore().run();
  };

  const addRowAfter = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor?.chain().focus().deleteRow().run();
  };

  const deleteTable = () => {
    editor?.chain().focus().deleteTable().run();
    setIsOpen(false);
  };

  const toggleHeaderRow = () => {
    editor?.chain().focus().toggleHeaderRow().run();
  };

  const toggleHeaderColumn = () => {
    editor?.chain().focus().toggleHeaderColumn().run();
  };

  const mergeOrSplitCells = () => {
    // Jika sel sudah di-merge, split
    if (editor?.can().splitCell()) {
      editor?.chain().focus().splitCell().run();
    }
    // Jika tidak, coba merge
    else if (editor?.can().mergeCells()) {
      editor?.chain().focus().mergeCells().run();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isTableActive && "bg-accent")}
            >
              <Table className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Table</span>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" className="w-48">
        {!isTableActive ? (
          <DropdownMenuItem onClick={insertTable} className="flex items-center">
            <Grid className="mr-2 h-4 w-4" />
            <span>Insert Table</span>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Column</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={addColumnBefore}>
                  Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addColumnAfter}>
                  After
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Row</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={addRowBefore}>
                  Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addRowAfter}>After</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem
              onClick={deleteColumn}
              className="flex items-center"
            >
              <Minus className="mr-2 h-4 w-4" />
              <span>Delete Column</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={deleteRow} className="flex items-center">
              <Minus className="mr-2 h-4 w-4" />
              <span>Delete Row</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={toggleHeaderRow}
              className="flex items-center"
            >
              <span>Toggle Header Row</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={toggleHeaderColumn}
              className="flex items-center"
            >
              <span>Toggle Header Column</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={mergeOrSplitCells}
              className="flex items-center"
            >
              <span>Merge/Split Cells</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={deleteTable}
              className="flex items-center text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Table</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
