import type { ReactNode } from "react";
import { Navbar } from "@/components/shell/navbar";

export const metadata = {
  title: "Dashboard | Any Documentation",
  description: "Any Documentation admin panel.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
