"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { File, Link, Upload, ChevronDown } from "lucide-react";
import { useToolbar } from "./toolbar-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Definisi ukuran yang tersedia
const heightOptions = [
  { label: "A4 Portrait", value: "842px" },
  { label: "A4 Landscape", value: "595px" },
  { label: "A3 Portrait", value: "1191px" },
  { label: "A3 Landscape", value: "842px" },
  { label: "A5 Portrait", value: "595px" },
  { label: "A5 Landscape", value: "420px" },
  { label: "HD (720p)", value: "720px" },
  { label: "Full HD (1080p)", value: "1080px" },
  { label: "4K (2160p)", value: "2160px" },
  { label: "Square", value: "600px" },
  { label: "Wide", value: "400px" },
  { label: "Tall", value: "800px" },
];

export const PDFViewerToolbar = () => {
  const { editor } = useToolbar();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [height, setHeight] = useState("842px"); // Default ke A4 Portrait
  const [isCustomHeight, setIsCustomHeight] = useState(false);
  const [customHeight, setCustomHeight] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi untuk memproses URL dari Google Drive
  const processURL = (url: string): string => {
    // Google Drive
    if (url.includes("drive.google.com/file/d/")) {
      const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    if (url.includes("drive.google.com/open?id=")) {
      const fileIdMatch = url.match(/[?&]id=([^&]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return url;
  };

  const insertPDFFromUrl = () => {
    if (!url) return;
    setError(null);

    try {
      // Proses URL jika perlu
      const processedUrl = processURL(url);

      // Validasi URL
      if (!url.includes("drive.google.com") && !url.startsWith("http")) {
        setError(
          "URL tidak valid. Gunakan URL Google Drive atau URL langsung ke file PDF."
        );
        return;
      }

      editor
        .chain()
        .focus()
        .setPDFViewer({
          src: processedUrl,
          height: isCustomHeight ? customHeight : height,
        })
        .run();

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error processing URL:", err);
      setError("Terjadi kesalahan saat memproses URL. Pastikan URL valid.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validasi ukuran file (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Ukuran file terlalu besar. Maksimum 10MB.");
        return;
      }

      // Validasi tipe file
      if (selectedFile.type !== "application/pdf") {
        setError("Hanya file PDF yang diperbolehkan.");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadPDF = async () => {
    if (!file) return;
    setError(null);
    setIsLoading(true);

    try {
      // Buat FormData untuk upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload file ke server
      const response = await fetch("/api/upload?type=pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal mengupload file");
      }

      const data = await response.json();
      const filePath = data.path; // path relatif ke file yang diupload

      // Gunakan path file untuk PDF viewer
      editor
        .chain()
        .focus()
        .setPDFViewer({
          src: filePath, // contoh: /assets/files/nama-file.pdf
          height: isCustomHeight ? customHeight : height,
        })
        .run();

      toast({
        title: "Berhasil",
        description: "File PDF berhasil diupload",
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setError("Terjadi kesalahan saat mengupload file. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return;

    const droppedFile = e.dataTransfer.files[0];

    // Validasi ukuran file (max 10MB)
    if (droppedFile.size > 10 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimum 10MB.");
      return;
    }

    // Validasi tipe file
    if (droppedFile.type !== "application/pdf") {
      setError("Hanya file PDF yang diperbolehkan.");
      return;
    }

    setFile(droppedFile);
    setError(null);
  };

  const resetForm = () => {
    setUrl("");
    setHeight("842px");
    setIsCustomHeight(false);
    setCustomHeight("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCurrentHeightLabel = () => {
    if (isCustomHeight) {
      return `Custom: ${customHeight}`;
    }
    const option = heightOptions.find((opt) => opt.value === height);
    return option ? option.label : "A4 Portrait";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
            >
              <File className="h-4 w-4" />
              <span className="text-xs">PDF</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambahkan PDF</DialogTitle>
              <DialogDescription>
                Tambahkan PDF dari URL atau upload file
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="url" className="w-full px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL PDF</Label>
                  <div className="flex items-center space-x-2">
                    <Link className="h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      id="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mendukung URL Google Drive atau URL langsung ke file PDF.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Ukuran Tinggi</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {getCurrentHeightLabel()}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {heightOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => {
                            setHeight(option.value);
                            setIsCustomHeight(false);
                          }}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => setIsCustomHeight(true)}
                        className="text-blue-600"
                      >
                        Custom...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isCustomHeight && (
                    <Input
                      placeholder="Contoh: 500px, 80vh, 50%"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File PDF</Label>
                  <div
                    className="flex items-center justify-center w-full"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">
                            Klik untuk upload
                          </span>{" "}
                          atau drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        title="Upload PDF"
                        aria-label="Upload PDF"
                      />
                    </label>
                  </div>
                  {file && (
                    <p className="text-sm text-gray-500 truncate">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    File akan disimpan di folder public/assets/files
                  </p>
                  <p className="text-xs text-green-600">
                    PDF lokal akan ditampilkan menggunakan object tag standar
                    yang lebih kompatibel dengan browser
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Ukuran Tinggi</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {getCurrentHeightLabel()}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {heightOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => {
                            setHeight(option.value);
                            setIsCustomHeight(false);
                          }}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => setIsCustomHeight(true)}
                        className="text-blue-600"
                      >
                        Custom...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isCustomHeight && (
                    <Input
                      placeholder="Contoh: 500px, 80vh, 50%"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button
                onClick={() => {
                  if (file) {
                    uploadPDF();
                  } else {
                    insertPDFFromUrl();
                  }
                }}
                disabled={(!url && !file) || isLoading}
              >
                {isLoading ? "Memproses..." : "Tambahkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipTrigger>
      <TooltipContent>
        <p>Sisipkan PDF</p>
      </TooltipContent>
    </Tooltip>
  );
};
