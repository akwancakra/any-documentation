import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    // Menonaktifkan Turbopack untuk mengatasi konflik dengan fumadocs-ui
    // turbo: false
  },
  webpack: (config, { isServer }) => {
    // Fallback untuk Node.js modules di client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
      };
    }

    return config;
  },
};

export default withMDX(config);
