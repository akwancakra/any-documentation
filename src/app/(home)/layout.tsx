import type { ReactNode } from "react";
import { SiteFooter } from "@/app/_components/site-footer";

export const metadata = {
  title: "Home | Any Documentation",
  description: "Any Documentation — browse, search, and contribute.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
