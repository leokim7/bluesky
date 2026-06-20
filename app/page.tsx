"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { LayerId, ModelId } from "@/lib/types";
import { LayerSidebar } from "@/components/Sidebar/LayerSidebar";
import { BottomTimeline } from "@/components/Timeline/BottomTimeline";
import { TopToolbar } from "@/components/Toolbar/TopToolbar";
import { ModelToggle } from "@/components/Toolbar/ModelToggle";
import { LegendBar } from "@/components/Toolbar/LegendBar";
import { Brand } from "@/components/Brand/Brand";

const BlueSkyMap = dynamic(() => import("@/components/Map/BlueSkyMap").then((m) => m.BlueSkyMap), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center text-zinc-500 text-sm">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("wind");
  const [activeModel, setActiveModel] = useState<ModelId>("ensemble");
  const [hourOffset, setHourOffset] = useState<number>(0); // 0 ~ 15*24
  const [particlesOn, setParticlesOn] = useState(true);

  return (
    <div className="h-screen w-screen relative">
      {/* Full-screen map */}
      <BlueSkyMap
        activeLayer={activeLayer}
        activeModel={activeModel}
        hourOffset={hourOffset}
        particlesOn={particlesOn}
      />

      {/* Top brand */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <Brand />
      </div>

      {/* Top-left: Search */}
      <div className="absolute top-3 left-3 z-30">
        <TopToolbar />
      </div>

      {/* Right sidebar: layers */}
      <div className="absolute top-20 right-3 z-30">
        <LayerSidebar
          activeLayer={activeLayer}
          onChange={setActiveLayer}
          particlesOn={particlesOn}
          onParticlesToggle={() => setParticlesOn((p) => !p)}
        />
      </div>

      {/* Bottom timeline */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-[min(1100px,90vw)]">
        <BottomTimeline hourOffset={hourOffset} onChange={setHourOffset} />
      </div>

      {/* Bottom-right: model toggle + legend */}
      <div className="absolute bottom-20 right-3 z-30 flex flex-col gap-2 items-end">
        <LegendBar layer={activeLayer} />
        <ModelToggle activeModel={activeModel} onChange={setActiveModel} />
      </div>
    </div>
  );
}
