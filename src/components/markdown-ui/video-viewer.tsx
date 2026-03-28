"use client";

import { useState, useEffect } from "react";
import { Play, ExternalLink, Info } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoViewerProps {
  src: string;
  width?: string;
  height?: string;
  objectFit?: "contain" | "cover" | "fill" | "scale-down" | "none";
}

// Helper functions untuk extract video ID
const extractYouTubeId = (url: string): string | null => {
  // Handle regular YouTube URLs dan YouTube shorts
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/watch\?v=([^"&?\/\s]{11})/,
    /youtu\.be\/([^"&?\/\s]{11})/,
    /youtube\.com\/embed\/([^"&?\/\s]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const regex =
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regex);
  return match ? match[3] : null;
};

const extractGoogleDriveId = (url: string): string | null => {
  const regex =
    /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Fungsi untuk mendapatkan aspect ratio berdasarkan height preset
const getAspectRatio = (height: string): number => {
  switch (height) {
    case "400px": // 16:9 HD
    case "600px": // 16:9 Full HD
      return 16 / 9;
    case "450px": // 4:3 Traditional
      return 4 / 3;
    case "300px": // 21:9 Ultra Wide atau Compact
      return 21 / 9;
    case "500px": // 1:1 Square atau Medium
      return 1;
    case "700px": // 9:16 Portrait atau Large
      return 9 / 16;
    default:
      return 16 / 9; // Default 16:9
  }
};

// Fungsi untuk mendapatkan CSS untuk iframe berdasarkan objectFit
const getIframeStyles = (objectFit: string) => {
  switch (objectFit) {
    case "cover":
      return {
        transform: "scale(1.1)", // Sedikit zoom untuk simulasi cover
        transformOrigin: "center",
      };
    case "fill":
      return {
        width: "100%",
        height: "100%",
        transform: "none",
      };
    case "none":
      return {
        width: "auto",
        height: "auto",
        maxWidth: "100%",
        maxHeight: "100%",
        transform: "none",
      };
    case "scale-down":
      return {
        width: "auto",
        height: "auto",
        maxWidth: "100%",
        maxHeight: "100%",
        transform: "none",
      };
    case "contain":
    default:
      return {
        width: "100%",
        height: "100%",
        transform: "none",
      };
  }
};

export function VideoViewer({
  src,
  width = "100%",
  height = "400px",
  objectFit = "contain",
}: VideoViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Set timeout untuk loading fallback
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything on server side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="my-4 w-full">
        <AspectRatio ratio={16 / 9}>
          <div className="flex items-center justify-center bg-gray-100 rounded-md border w-full h-full">
            <div className="text-center">
              <Play className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading video...</p>
            </div>
          </div>
        </AspectRatio>
      </div>
    );
  }

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Tentukan tipe video dan buat embed URL
  const isYouTube = src?.includes("youtube.com") || src?.includes("youtu.be");
  const isVimeo = src?.includes("vimeo.com");
  const isGoogleDrive = src?.includes("drive.google.com");
  const isExternalUrl =
    src?.startsWith("http://") || src?.startsWith("https://");

  let embedUrl = src;
  let canEmbed = true;

  if (isYouTube) {
    const videoId = extractYouTubeId(src);
    if (videoId) {
      // Periksa apakah ini adalah live URL
      if (src.includes("/live/")) {
        canEmbed = false; // YouTube live streams tidak bisa di-embed
      } else {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else {
      canEmbed = false;
    }
  } else if (isVimeo) {
    const videoId = extractVimeoId(src);
    if (videoId) {
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else {
      canEmbed = false;
    }
  } else if (isGoogleDrive) {
    const fileId = extractGoogleDriveId(src);
    if (fileId) {
      embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    } else {
      canEmbed = false;
    }
  } else if (!isExternalUrl) {
    // Local file
    embedUrl = src?.startsWith("/") ? src : `/${src}`;
  }

  // Get aspect ratio for the video
  const aspectRatio = getAspectRatio(height);

  // Jika tidak bisa di-embed, tampilkan fallback
  if (!canEmbed || hasError) {
    return (
      <div className="my-4 w-full">
        <AspectRatio ratio={aspectRatio}>
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-md border p-8 w-full h-full">
            <Play className="w-12 h-12 mb-4 text-gray-400" />
            <div className="w-full max-w-md mb-4">
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {hasError
                    ? "Video tidak dapat ditampilkan di sini. Klik tombol di bawah untuk membuka di tab baru."
                    : "Video ini tidak dapat di-embed. Gunakan link di bawah untuk menonton."}
                </AlertDescription>
              </Alert>
            </div>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Video
            </a>
          </div>
        </AspectRatio>
      </div>
    );
  }

  // Render video berdasarkan tipe
  if (isYouTube || isVimeo || isGoogleDrive) {
    const iframeStyles = getIframeStyles(objectFit);

    return (
      <div className="my-4 w-full">
        <AspectRatio ratio={aspectRatio}>
          <div className="relative w-full h-full bg-gray-100 rounded-md border overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <Play className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                  <p className="text-sm text-gray-500">Loading video...</p>
                </div>
              </div>
            )}
            <iframe
              src={embedUrl}
              className="absolute inset-0 border-0"
              loading="lazy"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={handleLoad}
              onError={handleError}
              style={{
                opacity: isLoading ? 0 : 1,
                transition: "opacity 0.3s ease-in-out",
                ...iframeStyles,
                // Untuk iframe, kita perlu menggunakan positioning dan transform
                left:
                  objectFit === "none" || objectFit === "scale-down"
                    ? "50%"
                    : "0",
                top:
                  objectFit === "none" || objectFit === "scale-down"
                    ? "50%"
                    : "0",
                transform:
                  objectFit === "none" || objectFit === "scale-down"
                    ? "translate(-50%, -50%)"
                    : iframeStyles.transform || "none",
              }}
            />
          </div>
        </AspectRatio>
      </div>
    );
  } else {
    // Local video files - object-fit bekerja dengan sempurna di sini
    return (
      <div className="my-4 w-full">
        <AspectRatio ratio={aspectRatio}>
          <div className="relative w-full h-full bg-gray-100 rounded-md border overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <Play className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                  <p className="text-sm text-gray-500">Loading video...</p>
                </div>
              </div>
            )}
            <video
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              controls
              preload="metadata"
              onLoadedData={handleLoad}
              onError={handleError}
              style={{
                opacity: isLoading ? 0 : 1,
                transition: "opacity 0.3s ease-in-out",
                objectFit: objectFit, // Object-fit bekerja sempurna untuk video tag
              }}
            >
              <p className="p-4 text-center text-sm text-gray-500">
                Your browser does not support the video player. Please{" "}
                <a
                  href={embedUrl}
                  download
                  className="text-blue-500 hover:underline"
                >
                  download file
                </a>{" "}
                to watch it.
              </p>
            </video>
          </div>
        </AspectRatio>
      </div>
    );
  }
}
