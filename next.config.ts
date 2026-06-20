import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // 사이트 게이트 비공개 모드는 없음 — 단독 도메인 bluesky.bmatrix.io
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
