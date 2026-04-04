import type { Metadata } from "next";

const siteUrl =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Any Documentation",
    template: "%s | Any Documentation",
  },
  description: "Browse, search, and contribute to documentation.",
  icons: {
    icon: [
      {
        url: "/images/favicons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/images/favicons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/images/icon.png",
        type: "image/png",
      },
    ],
    apple: "/images/favicons/apple-touch-icon.png",
  },
  manifest: "/images/favicons/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Any Docs",
    statusBarStyle: "default",
  },
  themeColor: "#0d9488",
  openGraph: {
    type: "website",
    siteName: "Any Documentation",
    title: "Any Documentation",
    description: "Browse, search, and contribute to documentation.",
    images: [{ url: "/images/icon.png", width: 512, height: 512, alt: "Any Documentation" }],
  },
  twitter: {
    card: "summary",
    title: "Any Documentation",
    description: "Browse, search, and contribute to documentation.",
    images: ["/images/icon.png"],
  },
};
