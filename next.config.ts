import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // 100% 클라이언트 사이드 SPA — Amplify Hosting (Web/static) 호환
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
