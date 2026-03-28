import type { ReactNode } from "react";

export const metadata = {
  title: "Logout | Wiki Docs",
  description: "Keluar dari wiki dokumentasi.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
