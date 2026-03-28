"use client";
import { useState } from "react";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorTypeDialog } from "./editor-type-dialog";

export function EditorTypeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Edit3 className="h-5 w-5 mr-2" />
        Create Wiki
      </Button>
      <EditorTypeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
