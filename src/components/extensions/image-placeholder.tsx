"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
  cn,
  isValidUrl,
} from "@/lib/utils";
import {
  type CommandProps,
  type Editor,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Image, Link, Upload } from "lucide-react";
import { type FormEvent, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";

export interface ImagePlaceholderOptions {
  HTMLAttributes: Record<string, any>;
  onDrop: (files: File[], editor: Editor) => void;
  onDropRejected?: (files: File[], editor: Editor) => void;
  onEmbed: (url: string, editor: Editor) => void;
  allowedMimeTypes?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      /**
       * Inserts an image placeholder
       */
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

// Fungsi helper untuk upload gambar ke server
export const uploadImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload?type=image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Gagal mengupload gambar");
    }

    const data = await response.json();
    return data.path; // Mengembalikan path relatif gambar
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: "image-placeholder",

  addOptions() {
    return {
      HTMLAttributes: {},
      onDrop: () => {},
      onDropRejected: () => {},
      onEmbed: () => {},
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertImagePlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: "image-placeholder",
        });
      },
    };
  },
});

function ImagePlaceholderComponent(props: NodeViewProps) {
  const { editor, extension, selected } = props;
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);

    const { files } = e.dataTransfer;
    if (!files || !files[0]) return;

    const file = files[0];

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar yang diperbolehkan");
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar (maksimum 5MB)");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload gambar ke server
      const imagePath = await uploadImage(file);

      // Insert gambar ke editor
      editor
        .chain()
        .focus()
        .setImage({
          src: imagePath,
          alt: file.name.replace(/\.[^/.]+$/, "") || "Image",
        })
        .run();

      toast({
        title: "Berhasil",
        description: "Gambar berhasil diupload",
      });

      // Hapus placeholder
      props.deleteNode();
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Terjadi kesalahan saat mengupload gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar yang diperbolehkan");
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar (maksimum 5MB)");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload gambar ke server
      const imagePath = await uploadImage(file);

      // Insert gambar ke editor
      editor
        .chain()
        .focus()
        .setImage({
          src: imagePath,
          alt: file.name.replace(/\.[^/.]+$/, "") || "Image",
        })
        .run();

      toast({
        title: "Berhasil",
        description: "Gambar berhasil diupload",
      });

      // Hapus placeholder dan tutup popover
      props.deleteNode();
      setOpen(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Terjadi kesalahan saat mengupload gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertEmbed = (e: FormEvent) => {
    e.preventDefault();
    const valid = isValidUrl(url);
    if (!valid) {
      setUrlError(true);
      return;
    }
    if (url !== "") {
      editor.chain().focus().setImage({ src: url }).run();
      extension.options.onEmbed(url, editor);
      setOpen(false);
      props.deleteNode();
    }
  };

  return (
    <NodeViewWrapper className="w-full">
      <Popover modal open={open}>
        <PopoverTrigger
          onClick={() => {
            setOpen(true);
          }}
          asChild
          className="w-full"
        >
          <div
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md bg-accent p-2 py-3 text-sm text-accent-foreground transition-colors hover:bg-secondary",
              selected && "bg-primary/10 hover:bg-primary/20"
            )}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Image className="h-6 w-6" />
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span>Uploading image...</span>
              </div>
            ) : (
              <>
                Insert Image
                {error && (
                  <span className="text-xs text-red-500 ml-2">{error}</span>
                )}
              </>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[450px] px-0 py-2"
          onPointerDownOutside={() => {
            setOpen(false);
          }}
          onEscapeKeyDown={() => {
            setOpen(false);
          }}
        >
          <Tabs defaultValue="upload" className="px-3">
            <TabsList>
              <TabsTrigger className="px-2 py-1 text-sm" value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger className="px-2 py-1 text-sm" value="url">
                <Link className="mr-2 h-4 w-4" />
                Image URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "my-2 rounded-md border border-dashed text-sm transition-colors",
                  isDragActive && "border-primary bg-secondary",
                  isDragReject && "border-destructive bg-destructive/10",
                  "hover:bg-secondary"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple={false}
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-input"
                  title="Upload gambar"
                  aria-label="Upload gambar"
                />
                <label
                  htmlFor="file-input"
                  className="flex cursor-pointer flex-col items-center gap-2 p-6"
                >
                  <div className="rounded-full border bg-card p-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="text-sm font-medium text-foreground">
                      Drag & drop image or{" "}
                      <span className="text-primary">browse</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Supports JPG, PNG (max. 5MB)
                    </div>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2 mb-2">
                Image will be saved in the public/assets/images folder
              </p>
            </TabsContent>
            <TabsContent value="url">
              <form
                className="flex flex-col gap-3 pt-2"
                onSubmit={handleInsertEmbed}
              >
                <div className="flex flex-col gap-1.5">
                  <Input
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setUrlError(false);
                    }}
                    className={cn(urlError && "border-destructive")}
                    placeholder="Enter image URL"
                  />
                  {urlError && (
                    <div className="text-xs text-destructive">
                      Enter a valid URL
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  type="submit"
                  disabled={url === ""}
                >
                  Insert Image
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}
