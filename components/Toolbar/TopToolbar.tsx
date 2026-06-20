"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export function TopToolbar() {
  const [q, setQ] = useState("");
  return (
    <div className="search-box flex items-center gap-2 px-3 py-1.5">
      <Search size={14} className="text-zinc-500" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="장소 검색…"
        className="bg-transparent outline-none text-sm w-44 placeholder:text-zinc-600"
      />
    </div>
  );
}
