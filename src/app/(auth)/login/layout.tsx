import type { ReactNode } from "react";

export const metadata = {
  title: "Login | Any Documentation",
  description: "Sign in to Any Documentation.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
