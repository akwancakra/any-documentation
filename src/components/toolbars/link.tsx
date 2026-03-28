"use client";

import { Link2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "@/components/toolbars/toolbar-provider";

export function LinkToolbar() {
  const { editor } = useToolbar();

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [urlError, setUrlError] = useState(false);

  const isActive = editor?.isActive("link");

  // Ketika popup dibuka, ambil teks yang dipilih
  useEffect(() => {
    if (open && editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      setText(selectedText);

      // Jika sudah ada link, ambil URL-nya
      if (isActive) {
        const linkAttrs = editor.getAttributes("link");
        setUrl(linkAttrs.href || "");
      } else {
        setUrl("");
      }
    }
  }, [open, editor, isActive]);

  // Reset state ketika popup ditutup
  useEffect(() => {
    if (!open) {
      setUrlError(false);
    }
  }, [open]);

  const handleAddLink = () => {
    if (!editor) return;

    // Validasi URL sederhana
    if (!url.trim() || !isValidUrl(url)) {
      setUrlError(true);
      return;
    }

    // Jika tidak ada teks yang dipilih, gunakan URL sebagai teks
    if (!text.trim()) {
      setText(url);
    }

    // Jika sudah ada link, update link tersebut
    if (isActive) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    } else {
      // Jika tidak ada teks yang dipilih, sisipkan teks dengan link
      if (editor.state.selection.empty) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${text || url}</a>`)
          .run();
      } else {
        // Jika ada teks yang dipilih, tambahkan link ke teks tersebut
        editor.chain().focus().setLink({ href: url }).run();
      }
    }

    setOpen(false);
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  // Fungsi validasi URL sederhana
  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      // Coba tambahkan https:// jika tidak ada protokol
      if (
        !urlString.startsWith("http://") &&
        !urlString.startsWith("https://")
      ) {
        try {
          new URL(`https://${urlString}`);
          setUrl(`https://${urlString}`);
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={!editor} asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(!open);
              }}
              className={cn("h-8 w-8", isActive && "bg-accent")}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Add Link</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={() => {
          setOpen(false);
        }}
        className="relative w-[300px] px-3 py-2.5"
      >
        <div className="relative w-full">
          <X
            onClick={() => {
              setOpen(false);
            }}
            className="absolute right-0 top-0 h-4 w-4 cursor-pointer"
          />
          <div className="flex w-full items-center gap-2">
            <h2 className="text-sm font-medium">Insert Link</h2>
          </div>

          <div className="my-3 w-full">
            <div className="mb-3">
              <Label className="mb-1 text-xs">Text</Label>
              <Input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                placeholder="Link text..."
              />
            </div>
            <div className="mb-2">
              <Label className="mb-1 text-xs">URL</Label>
              <Input
                className="w-full"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) {
                    setUrlError(false);
                  }
                }}
                placeholder="https://example.com"
              />
              {urlError && (
                <p className="mt-1 text-xs text-destructive">
                  Please enter a valid URL
                </p>
              )}
            </div>
          </div>

          <div className="actions mt-4 flex items-center justify-between">
            {isActive && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-3 text-xs"
                onClick={handleRemoveLink}
              >
                Remove Link
              </Button>
            )}
            <div
              className={cn(
                "flex items-center gap-2",
                isActive ? "" : "ml-auto"
              )}
            >
              <Button size="sm" className="h-8 px-3" onClick={handleAddLink}>
                {isActive ? "Update" : "Add"} Link
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
