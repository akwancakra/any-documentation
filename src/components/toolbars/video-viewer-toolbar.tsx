"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Video, Link, Upload, ChevronDown, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

// Definisi ukuran yang tersedia untuk video
const aspectRatioOptions = [
  { label: "16:9 (Widescreen)", value: "400px", ratio: "16:9" },
  { label: "16:9 (Large)", value: "600px", ratio: "16:9" },
  { label: "4:3 (Traditional)", value: "450px", ratio: "4:3" },
  { label: "21:9 (Ultra Wide)", value: "300px", ratio: "21:9" },
  { label: "1:1 (Square)", value: "500px", ratio: "1:1" },
  { label: "9:16 (Portrait)", value: "700px", ratio: "9:16" },
];

// Definisi object-fit options
const objectFitOptions = [
  {
    label: "Contain (Maintain Ratio)",
    value: "contain",
    description: "Video maintains aspect ratio, may have black bars",
  },
  {
    label: "Cover (Fill Container)",
    value: "cover",
    description:
      "Video fills container, may be cropped (works best with local videos)",
  },
  {
    label: "Fill (Stretch)",
    value: "fill",
    description:
      "Video stretches to fill container exactly (embedded videos only)",
  },
  {
    label: "Scale Down",
    value: "scale-down",
    description:
      "Same as contain but never larger than original (local videos only)",
  },
  {
    label: "None",
    value: "none",
    description: "Video keeps original size (local videos only)",
  },
];

export const VideoViewerToolbar = () => {
  const { editor } = useToolbar();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [height, setHeight] = useState("400px"); // Default ke 16:9 HD
  const [isCustomHeight, setIsCustomHeight] = useState(false);
  const [customHeight, setCustomHeight] = useState("");
  const [objectFit, setObjectFit] = useState("contain"); // Default contain
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi untuk memproses URL dari berbagai platform
  const processURL = (url: string): string => {
    // YouTube
    if (url.includes("youtube.com/watch?v=") || url.includes("youtu.be/")) {
      return url; // VideoViewer akan handle konversi ke embed
    }

    // Vimeo
    if (url.includes("vimeo.com/")) {
      return url; // VideoViewer akan handle konversi ke embed
    }

    // Google Drive
    if (url.includes("drive.google.com/file/d/")) {
      return url; // VideoViewer akan handle konversi ke preview
    }

    return url;
  };

  const insertVideoFromUrl = () => {
    if (!url) return;
    setError(null);

    try {
      // Proses URL jika perlu
      const processedUrl = processURL(url);

      // Validasi URL
      if (!url.startsWith("http")) {
        setError(
          "URL invalid. Use YouTube, Vimeo, Google Drive, or direct URL to video file."
        );
        return;
      }

      // Validasi khusus untuk YouTube live
      if (url.includes("youtube.com/live/") || url.includes("/live/")) {
        setError(
          "YouTube live streams cannot be embedded. Please use a regular YouTube video URL."
        );
        return;
      }

      editor
        .chain()
        .focus()
        .setVideoViewer({
          src: processedUrl,
          height: isCustomHeight ? customHeight : height,
          objectFit: objectFit as
            | "contain"
            | "cover"
            | "fill"
            | "scale-down"
            | "none",
        })
        .run();

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error processing URL:", err);
      setError(
        "An error occurred while processing the URL. Please ensure the URL is valid."
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validasi ukuran file (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size is too large. Maximum 50MB.");
        return;
      }

      // Validasi tipe file
      if (!selectedFile.type.startsWith("video/")) {
        setError("Only video files are allowed.");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadVideo = async () => {
    if (!file) return;
    setError(null);
    setIsLoading(true);

    try {
      // Buat FormData untuk upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload file ke server
      const response = await fetch("/api/upload?type=video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      const filePath = data.path; // path relatif ke file yang diupload

      // Gunakan path file untuk video viewer
      editor
        .chain()
        .focus()
        .setVideoViewer({
          src: filePath, // contoh: /assets/videos/nama-file.mp4
          height: isCustomHeight ? customHeight : height,
          objectFit: objectFit as
            | "contain"
            | "cover"
            | "fill"
            | "scale-down"
            | "none",
        })
        .run();

      toast({
        title: "Success",
        description: "Video file uploaded successfully",
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error uploading video:", error);
      setError("An error occurred while uploading the file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return;

    const droppedFile = e.dataTransfer.files[0];

    // Validasi ukuran file (max 50MB)
    if (droppedFile.size > 50 * 1024 * 1024) {
      setError("File size is too large. Maximum 50MB.");
      return;
    }

    // Validasi tipe file
    if (!droppedFile.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    setFile(droppedFile);
    setError(null);
  };

  const resetForm = () => {
    setUrl("");
    setHeight("400px");
    setIsCustomHeight(false);
    setCustomHeight("");
    setObjectFit("contain");
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
    const option = aspectRatioOptions.find((opt) => opt.value === height);
    return option ? option.label : "16:9 (Widescreen)";
  };

  const getCurrentObjectFitLabel = () => {
    const option = objectFitOptions.find((opt) => opt.value === objectFit);
    return option ? option.label : "Contain (Maintain Ratio)";
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
              <Video className="h-4 w-4" />
              <span className="text-xs">Video</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Video</DialogTitle>
              <DialogDescription>
                Add video from URL or upload file
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="url" className="w-full px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL Video</Label>
                  <div className="flex items-center space-x-2">
                    <Link className="h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      id="url"
                      placeholder="https://youtube.com/watch?v=... atau https://vimeo.com/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, Google Drive, or direct URL to
                    video file.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
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
                      {aspectRatioOptions.map((option, index) => (
                        <DropdownMenuItem
                          key={index}
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
                      placeholder="Example: 500px, 80vh, 50%"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Video Fit</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {getCurrentObjectFitLabel()}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full max-w-sm">
                      {objectFitOptions.map((option, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => setObjectFit(option.value)}
                          className="flex flex-col items-start space-y-1"
                        >
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Video File</Label>
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
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          MP4, WebM, OGV (MAX. 50MB)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                        title="Upload Video"
                        aria-label="Upload Video"
                      />
                    </label>
                  </div>
                  {file && (
                    <p className="text-sm text-gray-500 truncate">
                      {file.name} ({Math.round(file.size / 1024 / 1024)} MB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    File akan disimpan di folder public/assets/videos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
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
                      {aspectRatioOptions.map((option, index) => (
                        <DropdownMenuItem
                          key={index}
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
                      placeholder="Example: 500px, 80vh, 50%"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Video Fit</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {getCurrentObjectFitLabel()}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full max-w-sm">
                      {objectFitOptions.map((option, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => setObjectFit(option.value)}
                          className="flex flex-col items-start space-y-1"
                        >
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="px-4 mb-2">
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (file) {
                    uploadVideo();
                  } else {
                    insertVideoFromUrl();
                  }
                }}
                disabled={(!url && !file) || isLoading}
              >
                {isLoading ? "Processing..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipTrigger>
      <TooltipContent>
        <p>Insert Video</p>
      </TooltipContent>
    </Tooltip>
  );
};
