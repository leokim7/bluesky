"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import type { LayerId, LngLat } from "@/lib/types";
import { fetchGrid, type GridPoint } from "@/lib/blueskyApi";
import { idwInterpolate } from "@/lib/idw";
import { colorFor } from "@/lib/colorPalettes";
import { getLayer } from "@/lib/layers";

const LAYER_SOURCE_ID = "bluesky-layer-source";
const LAYER_RASTER_ID = "bluesky-layer-raster";

type Props = {
  map: mapboxgl.Map;
  layer: LayerId;
  hourOffset: number;
};

/** viewport 안에서 균등 격자 좌표 생성 (한반도 영역 대상 stepDeg ~ 0.5°) */
function makeGrid(bounds: mapboxgl.LngLatBounds, stepDeg = 0.5): LngLat[] {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const pts: LngLat[] = [];
  for (let lat = sw.lat; lat <= ne.lat; lat += stepDeg) {
    for (let lng = sw.lng; lng <= ne.lng; lng += stepDeg) {
      pts.push({ lng, lat });
    }
  }
  return pts;
}

/** 컬러 격자를 캔버스로 그려서 ImageSource에 업로드 */
function renderToCanvas(
  bounds: mapboxgl.LngLatBounds,
  grid: GridPoint[],
  layer: LayerId,
  width = 720,
  height = 480,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);

  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const lngRange = ne.lng - sw.lng;
  const latRange = ne.lat - sw.lat;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const lng = sw.lng + (px / width) * lngRange;
      const lat = ne.lat - (py / height) * latRange;
      const v = idwInterpolate(lng, lat, grid, 2, 1.5);
      const idx = (py * width + px) * 4;
      if (v === null) {
        img.data[idx + 3] = 0;
      } else {
        const [r, g, b] = colorFor(layer, v);
        img.data[idx]     = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 180;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function LayerRenderer({ map, layer, hourOffset }: Props) {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const def = getLayer(layer);
    if (!def || !def.enabled || !def.variable) return;

    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    let alive = true;

    async function load() {
      setLoading(true);
      const bounds = map.getBounds();
      if (!bounds) {
        setLoading(false);
        return;
      }
      const grid = makeGrid(bounds, 0.5);

      try {
        const result = await fetchGrid(grid, def!.variable!, hourOffset, ctrl.signal);
        if (!alive) return;

        const canvas = renderToCanvas(bounds, result, layer);
        const dataUrl = canvas.toDataURL("image/png");

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const coords: [[number, number], [number, number], [number, number], [number, number]] = [
          [sw.lng, ne.lat], // top-left
          [ne.lng, ne.lat], // top-right
          [ne.lng, sw.lat], // bottom-right
          [sw.lng, sw.lat], // bottom-left
        ];

        if (map.getLayer(LAYER_RASTER_ID)) map.removeLayer(LAYER_RASTER_ID);
        if (map.getSource(LAYER_SOURCE_ID)) map.removeSource(LAYER_SOURCE_ID);

        map.addSource(LAYER_SOURCE_ID, {
          type: "image",
          url: dataUrl,
          coordinates: coords,
        });
        map.addLayer({
          id: LAYER_RASTER_ID,
          type: "raster",
          source: LAYER_SOURCE_ID,
          paint: {
            "raster-fade-duration": 300,
            "raster-opacity": 0.78,
          },
        });
      } catch {
        // silenced
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    const onMoveEnd = () => load();
    map.on("moveend", onMoveEnd);

    return () => {
      alive = false;
      ctrl.abort();
      map.off("moveend", onMoveEnd);
      if (map.getLayer(LAYER_RASTER_ID)) map.removeLayer(LAYER_RASTER_ID);
      if (map.getSource(LAYER_SOURCE_ID)) map.removeSource(LAYER_SOURCE_ID);
    };
  }, [map, layer, hourOffset]);

  return loading ? (
    <div className="absolute top-3 right-[260px] z-30 text-[10px] text-accent-cyan bg-bg-1/85 backdrop-blur px-2 py-1 rounded">
      Loading {layer}…
    </div>
  ) : null;
}
