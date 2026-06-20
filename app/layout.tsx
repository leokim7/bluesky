import "./globals.css";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "bluesky · BlueMatrix Weather",
  description: "Interactive multi-model weather map powered by BlueMatrix L2 (ECMWF + GFS + Open-Meteo + Stormglass).",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg-0 text-zinc-200 antialiased h-screen overflow-hidden">{children}</body>
    </html>
  );
}
