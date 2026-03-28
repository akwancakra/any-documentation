import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import { AuthProvider } from "@/app/(auth)/login/_components/provider";
import { Toaster } from "@/components/ui/sonner";
import { ToastProvider } from "@/components/ui/use-toast";
import SearchDialog from "./_components/search";

export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen font-sans">
        <AuthProvider>
          <ToastProvider>
            <RootProvider
              search={{
                SearchDialog,
              }}
            >
              <div className="flex min-h-screen flex-col">
                {children}
              </div>
            </RootProvider>
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
