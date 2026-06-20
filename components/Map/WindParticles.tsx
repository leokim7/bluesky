"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { fetchGrid } from "@/lib/blueskyApi";
import { idwInterpolate } from "@/lib/idw";

type Props = {
  map: mapboxgl.Map;
  hourOffset: number;
};

type GridUV = {
  lng: number;
  lat: number;
  u: number | null;
  v: number | null;
};

type Particle = { x: number; y: number; age: number; maxAge: number; lng: number; lat: number };

/**
 * Wind streamlines — viewport 좌표 격자에서 u/v components 를 fetch 한 후
 * Canvas 에 파티클을 띄움.
 */
export function WindParticles({ map, hourOffset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<GridUV[]>([]);
  const animRef = useRef<number | null>(null);

  // ── Setup canvas overlay ────────────────────────────
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "particle-canvas";
    map.getContainer().appendChild(canvas);
    canvasRef.current = canvas;

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      c.width = map.getContainer().clientWidth;
      c.height = map.getContainer().clientHeight;
    }
    resize();
    map.on("resize", resize);

    return () => {
      map.off("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      canvas.remove();
    };
  }, [map]);

  // ── Fetch u/v grid ─────────────────────────────────
  useEffect(() => {
    let alive = true;

    async function load() {
      const bounds = map.getBounds();
      if (!bounds) return;
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const z = map.getZoom();
      const step = z >= 7 ? 0.8 : z >= 5 ? 1.8 : 3.5;
      const pts: { lng: number; lat: number }[] = [];
      for (let lat = sw.lat; lat <= ne.lat; lat += step) {
        for (let lng = sw.lng; lng <= ne.lng; lng += step) {
          pts.push({ lng, lat });
        }
      }
      // Hard cap 60 포인트
      const sampled = pts.length > 60 ? pts.filter((_, i) => i % Math.ceil(pts.length / 60) === 0) : pts;
      // Wind 격자는 한 번 호출로 speed + direction 같이 받음 (캐시 활용)
      const [speedRes, dirRes] = await Promise.all([
        fetchGrid(sampled, "wind_speed_10m", hourOffset),
        fetchGrid(sampled, "wind_direction_10m", hourOffset),
      ]);
      if (!alive) return;

      // Convert speed + dir to u/v (캐시 공유로 speed/dir 같은 좌표 동일 호출)
      const grid: GridUV[] = speedRes.map((s, i) => {
        const dir = dirRes[i]?.value ?? null;
        const speed = s.value;
        if (speed === null || dir === null) {
          return { lng: s.lng, lat: s.lat, u: null, v: null };
        }
        // Meteo: dir = direction FROM. Convert to vector pointing where wind goes.
        const rad = ((dir + 180) * Math.PI) / 180;
        return {
          lng: s.lng,
          lat: s.lat,
          u: speed * Math.sin(rad),
          v: speed * Math.cos(rad),
        };
      });

      gridRef.current = grid;
    }

    load();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onMoveEnd = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(load, 500);
    };
    map.on("moveend", onMoveEnd);

    return () => {
      alive = false;
      if (debounce) clearTimeout(debounce);
      map.off("moveend", onMoveEnd);
    };
  }, [map, hourOffset]);

  // ── Animation loop ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = canvas;
    const g = ctx;

    const PARTICLE_COUNT = 1200;
    const particles: Particle[] = [];

    function rand(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    function spawn(p: Particle, bounds: mapboxgl.LngLatBounds) {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      p.lng = rand(sw.lng, ne.lng);
      p.lat = rand(sw.lat, ne.lat);
      p.age = 0;
      // Windy 스타일 — 자취가 더 길게 보이도록 maxAge 증가
      p.maxAge = rand(80, 220);
    }

    function init() {
      const bounds = map.getBounds();
      if (!bounds) return;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p: Particle = { x: 0, y: 0, age: 0, maxAge: 0, lng: 0, lat: 0 };
        spawn(p, bounds);
        p.age = rand(0, p.maxAge);
        particles.push(p);
      }
    }
    init();

    function tick() {
      g.globalCompositeOperation = "destination-in";
      g.fillStyle = "rgba(0,0,0,0.92)";
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "lighter";

      const grid = gridRef.current;
      const bounds = map.getBounds();
      if (!bounds || grid.length === 0) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      for (const p of particles) {
        const u = idwInterpolate(p.lng, p.lat, grid.map(g => ({ lng: g.lng, lat: g.lat, value: g.u })), 1.5, 8);
        const v = idwInterpolate(p.lng, p.lat, grid.map(g => ({ lng: g.lng, lat: g.lat, value: g.v })), 1.5, 8);

        if (u === null || v === null) {
          spawn(p, bounds);
          continue;
        }

        const oldLng = p.lng;
        const oldLat = p.lat;

        // Windy 스타일 — 풍속에 비례하되 시각적으로 자연스러운 흐름
        // zoom-aware: 줌인하면 더 느리게 (지도 위 표현 일정)
        const zoom = map.getZoom();
        const zoomFactor = Math.pow(2, 5 - zoom); // zoom 5 기준 정규화
        const scale = 0.0008 * zoomFactor;
        p.lng += u * scale;
        p.lat += v * scale;
        p.age++;

        // Project to screen
        const p1 = map.project([oldLng, oldLat]);
        const p2 = map.project([p.lng, p.lat]);

        // Speed → color brightness
        const speed = Math.hypot(u, v);
        const alpha = Math.min(0.7, 0.25 + speed / 25);
        g.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        g.lineWidth = 0.9;
        g.beginPath();
        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
        g.stroke();

        if (p.age >= p.maxAge) spawn(p, bounds);
      }

      animRef.current = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [map]);

  return null;
}
