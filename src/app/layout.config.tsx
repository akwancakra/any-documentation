import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { SiteLogo } from "@/components/shell/site-logo";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <SiteLogo asLink={false} className="text-base" size="sm" />,
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};
