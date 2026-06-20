import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // Amplify Hosting WEB_COMPUTE (SSR) — auto-detected platform
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
