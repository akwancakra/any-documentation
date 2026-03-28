"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditorTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelect = (type: "mdx" | "live") => {
    setLoading(true);
    if (type === "live") {
      router.push("/editor/create?type=live");
    } else {
      router.push("/editor/create");
    }
    setTimeout(() => onOpenChange(false), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs w-full">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2 px-6">
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => handleSelect("mdx")}
            disabled={loading}
          >
            MDX editor (split view)
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleSelect("live")}
            disabled={loading}
          >
            Visual editor (TipTap)
          </Button>
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Split view matches the page used to edit docs and previews like /docs.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
