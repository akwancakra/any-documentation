import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/app/(auth)/login/_components/provider";
import { Toaster } from "@/components/ui/sonner";
import { ToastProvider } from "@/components/ui/use-toast";
import SearchDialog from "./_components/search";
import { rootMetadata } from "./root-metadata";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata = rootMetadata;

export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} font-sans`} suppressHydrationWarning>
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
