"use client";

import type { ModelId } from "@/lib/types";

const MODELS: { id: ModelId; label: string; res: string }[] = [
  { id: "ensemble", label: "Ensemble", res: "BlueMatrix" },
  { id: "ecmwf",    label: "ECMWF",    res: "0.25°" },
  { id: "gfs",      label: "GFS",      res: "0.25°" },
];

type Props = { activeModel: ModelId; onChange: (id: ModelId) => void };

export function ModelToggle({ activeModel, onChange }: Props) {
  return (
    <div className="flex bg-bg-1/85 backdrop-blur rounded-lg border border-white/5 overflow-hidden">
      {MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={[
            "flex flex-col items-center px-3 py-1.5 text-[10px] transition-all",
            activeModel === m.id
              ? "bg-accent-blue text-white"
              : "text-zinc-400 hover:bg-bg-2",
          ].join(" ")}
        >
          <span className="font-bold tracking-tight">{m.label}</span>
          <span className="text-[9px] opacity-70">{m.res}</span>
        </button>
      ))}
    </div>
  );
}
