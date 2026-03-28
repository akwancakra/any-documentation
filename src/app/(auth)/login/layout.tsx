import type { ReactNode } from "react";

export const metadata = {
  title: "Login | Wiki Docs",
  description: "Masuk ke wiki dokumentasi.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
