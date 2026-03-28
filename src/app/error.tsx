"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <div className="w-full max-w-md rounded-lg bg-muted border border-border overflow-auto">
        <pre className="text-sm text-left p-4 leading-relaxed font-mono text-destructive whitespace-pre-wrap break-words max-w-full">
          {error.message || "Silakan coba lagi atau kembali ke beranda."}
        </pre>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          Coba lagi
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/">Beranda</a>
        </Button>
      </div>
    </div>
  );
}
