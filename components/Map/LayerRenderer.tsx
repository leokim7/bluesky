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

/** viewport 안에서 균등 격자 좌표 생성 — viewport 보다 약간 확장 + 자동 thinning */
function makeGrid(bounds: mapboxgl.LngLatBounds, zoom: number): LngLat[] {
  // zoom 별 step: 줌인하면 더 촘촘, 줌아웃하면 듬성듬성
  const stepDeg = zoom >= 7 ? 0.6 : zoom >= 5 ? 1.2 : 2.5;
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  // viewport 가장자리 IDW 자연스럽게 보간되도록 1 step 만큼 확장
  const pad = stepDeg;
  const minLat = sw.lat - pad;
  const maxLat = ne.lat + pad;
  const minLng = sw.lng - pad;
  const maxLng = ne.lng + pad;
  const pts: LngLat[] = [];
  for (let lat = minLat; lat <= maxLat; lat += stepDeg) {
    for (let lng = minLng; lng <= maxLng; lng += stepDeg) {
      pts.push({ lng, lat });
    }
  }
  // Hard cap — 100 포인트 초과 시 자동 thinning
  if (pts.length > 100) {
    const skip = Math.ceil(pts.length / 100);
    return pts.filter((_, i) => i % skip === 0);
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
      const v = idwInterpolate(lng, lat, grid, 1.5, 8);
      const idx = (py * width + px) * 4;
      if (v === null) {
        img.data[idx + 3] = 0;
      } else {
        const [r, g, b] = colorFor(layer, v);
        img.data[idx]     = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        // Canvas alpha — 컬러는 살리되 지도가 보이도록 130 (51%)
        img.data[idx + 3] = 130;
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
      const grid = makeGrid(bounds, map.getZoom());

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
        // 첫 라벨 레이어 위에 ← 국가/도시 이름이 컬러 위로 보이게
        const style = map.getStyle();
        const firstSymbol = style?.layers?.find((l) => l.type === "symbol")?.id;

        map.addLayer({
          id: LAYER_RASTER_ID,
          type: "raster",
          source: LAYER_SOURCE_ID,
          paint: {
            "raster-fade-duration": 300,
            // Windy 스타일 — 지도 가시성 + 컬러 강도 양립
            "raster-opacity": 0.55,
            "raster-saturation": 0.35,   // 색 진하게
            "raster-contrast":   0.15,    // 살짝 또렷
            "raster-resampling": "linear",
          },
        }, firstSymbol);
      } catch {
        // silenced
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    // moveend 가 너무 자주 발생 — 500ms debounce
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const onMoveEnd = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => load(), 500);
    };
    map.on("moveend", onMoveEnd);

    return () => {
      alive = false;
      ctrl.abort();
      if (debounceTimer) clearTimeout(debounceTimer);
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
