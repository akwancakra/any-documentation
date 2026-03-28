import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/shell/site-logo";
import { generatePageTree } from "@/lib/dynamic-source";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const tree = await generatePageTree();

  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: <SiteLogo asLink={false} className="text-base" />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
