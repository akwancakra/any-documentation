import type { ReactNode } from "react";

export const metadata = {
  title: "Logout | Any Documentation",
  description: "Sign out of Any Documentation.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
