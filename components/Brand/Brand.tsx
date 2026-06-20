"use client";

import { Cloud } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-1/80 backdrop-blur border border-white/5">
      <Cloud size={16} className="text-accent-cyan" />
      <span className="font-bold text-sm tracking-tight">bluesky</span>
      <span className="text-[10px] text-zinc-500 font-mono uppercase">.bmatrix.io</span>
    </div>
  );
}
