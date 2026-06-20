"use client";

import { PALETTES } from "@/lib/colorPalettes";
import type { LayerId } from "@/lib/types";
import { getLayer } from "@/lib/layers";

type Props = { layer: LayerId };

export function LegendBar({ layer }: Props) {
  const def = getLayer(layer);
  const stops = PALETTES[layer];
  if (!def || !stops || !def.enabled) return null;

  return (
    <div className="legend-bar">
      <span className="font-mono text-[9px] text-accent-cyan font-bold tracking-wide">{def.unit}</span>
      {stops.map(([v, c], i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="legend-swatch" style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }} />
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}
