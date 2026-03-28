"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
  src: string;
  width?: string | number;
  height?: string | number;
  title?: string;
  className?: string;
}

export function PDFViewer({
  src,
  width = "100%",
  height = "500px",
  title,
  className,
}: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);

  // Tentukan jenis sumber PDF
  const isGoogleDrive = src.includes("drive.google.com");
  const isExternalUrl = src.startsWith("http://") || src.startsWith("https://");
  const isDataUrl = src.startsWith("data:");
  const isLocalFile = !isExternalUrl && !isDataUrl;

  // Hanya tambahkan awalan / jika src bukan URL lengkap (tidak dimulai dengan http:// atau https://)
  const pdfSrc =
    isExternalUrl || isDataUrl ? src : src.startsWith("/") ? src : `/${src}`;

  // Tambahkan parameter untuk Google Drive jika diperlukan
  const finalSrc =
    isGoogleDrive && !pdfSrc.includes("#view=")
      ? `${pdfSrc}#view=FitH`
      : pdfSrc;

  return (
    <div className={cn("my-4", className)}>
      {title && <div className="text-center font-medium mb-2">{title}</div>}
      <div className="overflow-hidden rounded-md border">
        {isLocalFile ? (
          // Gunakan object tag untuk file lokal
          <object
            data={finalSrc}
            type="application/pdf"
            width={width}
            height={height}
            className="w-full"
          >
            <p className="p-4 text-center text-sm text-gray-500">
              Browser Anda tidak mendukung tampilan PDF. Silakan{" "}
              <a
                href={finalSrc}
                download
                className="text-blue-500 hover:underline"
              >
                download file
              </a>{" "}
              untuk melihatnya.
            </p>
          </object>
        ) : (
          // Gunakan iframe untuk URL eksternal
          <iframe
            src={finalSrc}
            width={width}
            height={height}
            style={{ border: "none" }}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            allow="fullscreen"
            referrerPolicy="no-referrer"
            onError={() => {
              setError(
                "Gagal memuat PDF. Coba gunakan URL yang dapat diakses publik."
              );
            }}
          />
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
            <div className="text-center">
              <p className="text-sm text-gray-700">{error}</p>
              <button
                className="mt-4 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                onClick={() => setError(null)}
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
