import type { ReactNode } from "react";
import { Navbar } from "../(home)/_components/navbar";

export const metadata = {
  title: "Dashboard | Wiki Docs",
  description: "Wiki documentation admin panel.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
