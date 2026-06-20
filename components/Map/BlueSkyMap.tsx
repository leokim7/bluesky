"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ClickPopup } from "@/components/Popup/ClickPopup";
import { WindParticles } from "@/components/Map/WindParticles";
import { LayerRenderer } from "@/components/Map/LayerRenderer";
import type { LayerId, ModelId } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
mapboxgl.accessToken = MAPBOX_TOKEN;

type Props = {
  activeLayer: LayerId;
  activeModel: ModelId;
  hourOffset: number;
  particlesOn: boolean;
};

export function BlueSkyMap({ activeLayer, hourOffset, particlesOn }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [clickPoint, setClickPoint] = useState<{ lng: number; lat: number } | null>(null);

  // ── Initialize map ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [126.98, 35.0], // East Asia
      zoom: 5,
      projection: "mercator",
      attributionControl: false,
    });

    map.on("load", () => {
      setMapReady(true);
      // Force resize once dom mounted
      setTimeout(() => map.resize(), 100);
    });

    map.on("click", (e) => {
      setClickPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ height: "100vh", width: "100vw" }}
      />

      {/* Color layer renderer (per active layer) */}
      {mapReady && mapRef.current && (
        <LayerRenderer
          map={mapRef.current}
          layer={activeLayer}
          hourOffset={hourOffset}
        />
      )}

      {/* Wind particles (only when wind/gust active + toggle on) */}
      {mapReady && mapRef.current && particlesOn && (activeLayer === "wind" || activeLayer === "gust") && (
        <WindParticles map={mapRef.current} hourOffset={hourOffset} />
      )}

      {/* Click popup */}
      {clickPoint && (
        <ClickPopup point={clickPoint} onClose={() => setClickPoint(null)} />
      )}
    </>
  );
}
