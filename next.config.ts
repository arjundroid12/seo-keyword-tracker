import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turso env must be available at runtime, not build-time
  experimental: {
    // none needed
  },
};

export default nextConfig;
