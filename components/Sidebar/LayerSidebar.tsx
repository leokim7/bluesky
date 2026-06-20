"use client";

import { LAYERS } from "@/lib/layers";
import type { LayerId } from "@/lib/types";
import {
  Wind, Thermometer, CloudRain, CloudDrizzle, Cloud, CloudLightning,
  Activity, Droplets, Eye, Waves, Radar, Satellite, Tornado, Zap, Lock, Sparkles,
} from "lucide-react";

const ICONS: Record<LayerId, React.ReactNode> = {
  wind:       <Wind size={14} />,
  gust:       <Wind size={14} />,
  temp:       <Thermometer size={14} />,
  rain:       <CloudRain size={14} />,
  rainAccum:  <CloudDrizzle size={14} />,
  clouds:     <Cloud size={14} />,
  storm:      <CloudLightning size={14} />,
  pressure:   <Activity size={14} />,
  humidity:   <Droplets size={14} />,
  visibility: <Eye size={14} />,
  waves:      <Waves size={14} />,
  radar:      <Radar size={14} />,
  satellite:  <Satellite size={14} />,
  hurricane:  <Tornado size={14} />,
  lightning:  <Zap size={14} />,
};

type Props = {
  activeLayer: LayerId;
  onChange: (id: LayerId) => void;
  particlesOn: boolean;
  onParticlesToggle: () => void;
};

export function LayerSidebar({ activeLayer, onChange, particlesOn, onParticlesToggle }: Props) {
  // 정렬 — Windy 스타일 순서
  const ordered: LayerId[] = [
    "radar", "satellite",
    "wind", "gust",
    "rain", "rainAccum",
    "temp", "clouds",
    "storm", "hurricane", "lightning",
    "pressure", "humidity", "visibility",
    "waves",
  ];

  return (
    <aside className="w-[220px] max-h-[calc(100vh-200px)] overflow-y-auto bg-bg-1/85 backdrop-blur-md border border-white/5 rounded-2xl p-3 space-y-1.5">
      <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Layers</span>
        <span className="text-[10px] text-accent-cyan font-mono">{LAYERS.filter(l => l.enabled).length}/{LAYERS.length}</span>
      </div>

      {ordered.map((id) => {
        const layer = LAYERS.find((l) => l.id === id)!;
        const isActive = activeLayer === id && layer.enabled;
        const cls = ["layer-btn"];
        if (isActive) cls.push("is-active");
        if (!layer.enabled) cls.push("is-locked");

        return (
          <button
            key={id}
            className={cls.join(" ")}
            onClick={() => layer.enabled && onChange(id)}
            disabled={!layer.enabled}
            title={layer.source}
          >
            <span className="icon-wrap">{ICONS[id]}</span>
            <span className="flex-1 text-left">{layer.label}</span>
            {!layer.enabled ? (
              <Lock size={11} className="text-zinc-600" />
            ) : (
              <span className="text-[9px] text-zinc-500 font-mono">{layer.unit}</span>
            )}
          </button>
        );
      })}

      {/* Particles toggle (only meaningful when wind/gust active) */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between px-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
          <Sparkles size={10} /> Particles
        </span>
        <button
          onClick={onParticlesToggle}
          className={[
            "relative inline-flex h-4 w-8 items-center rounded-full transition-colors",
            particlesOn ? "bg-accent-cyan" : "bg-zinc-700",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
              particlesOn ? "translate-x-4" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Footer info */}
      <div className="pt-3 text-[9px] text-zinc-600 leading-relaxed">
        Powered by <span className="text-accent-cyan font-bold">BlueMatrix L2</span><br />
        api-dev.bmatrix.io · ECMWF · GFS · Open-Meteo
      </div>
    </aside>
  );
}
