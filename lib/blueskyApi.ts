// ────────────────────────────────────────────────────
// BlueMatrix L2 Pipeline API client
// ────────────────────────────────────────────────────
// 모든 데이터 호출이 이 함수를 통과. Admin 에서 발행한 API 키를
// X-API-Key 헤더로 첨부 (Production), Dev 는 키 없이 호출 가능.
// ────────────────────────────────────────────────────
import type { PipelineResponse, WeatherPoint, LngLat } from "./types";

const PIPELINE_URL =
  process.env.NEXT_PUBLIC_PIPELINE_API_URL ?? "https://api-dev.bmatrix.io";

const API_KEY = process.env.NEXT_PUBLIC_BLUESKY_API_KEY ?? "";

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  return headers;
}

// ── 단일 좌표 weather ─────────────────────────────────
export async function fetchWeatherPoint(
  lat: number,
  lon: number,
  opts?: { days?: number; past_days?: number; signal?: AbortSignal },
): Promise<PipelineResponse<WeatherPoint["current"] extends infer T ? { current: T; hourly?: unknown; daily?: unknown } : never>> {
  const params = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    days: String(opts?.days ?? 7),
    past_days: String(opts?.past_days ?? 0),
  });
  const url = `${PIPELINE_URL}/v1/weather?${params.toString()}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    signal: opts?.signal,
    // @ts-expect-error Next.js fetch extension
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Pipeline /v1/weather ${res.status}`);
  return res.json();
}

// ── 격자 (multi-coord) bulk ─────────────────────────
// 여러 좌표를 병렬로 호출 (Pipeline 캐시 + L1 in-memory hit 활용)
export type GridPoint = LngLat & { value: number | null };

export async function fetchGrid(
  coords: LngLat[],
  variable: string,
  hour: number,
  signal?: AbortSignal,
): Promise<GridPoint[]> {
  const calls = coords.map(async (c) => {
    try {
      const r = await fetchWeatherPoint(c.lat, c.lng, { signal });
      const d = r.data as {
        current?: Record<string, unknown>;
        hourly?: { time?: string[]; [k: string]: unknown };
      };
      // Hour=0 → current. hour > 0 → hourly[h] 추출
      let value: number | null = null;
      if (hour === 0 && d.current) {
        value = (d.current[variable] as number) ?? null;
      } else if (d.hourly && Array.isArray(d.hourly[variable])) {
        const arr = d.hourly[variable] as number[];
        value = arr[hour] ?? null;
      }
      return { ...c, value };
    } catch {
      return { ...c, value: null };
    }
  });
  return Promise.all(calls);
}

// ── Marine (Stormglass) ─────────────────────────────
export async function fetchMarinePoint(
  lat: number,
  lon: number,
  signal?: AbortSignal,
) {
  const url = `${PIPELINE_URL}/v1/marine?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  // @ts-expect-error Next.js fetch extension
  const res = await fetch(url, { headers: authHeaders(), signal, next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Pipeline /v1/marine ${res.status}`);
  return res.json();
}

// ── Ensemble (ECMWF + GFS) ──────────────────────────
export async function fetchEnsemblePoint(
  lat: number,
  lon: number,
  signal?: AbortSignal,
) {
  const url = `${PIPELINE_URL}/v1/ensemble?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  // @ts-expect-error Next.js fetch extension
  const res = await fetch(url, { headers: authHeaders(), signal, next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`Pipeline /v1/ensemble ${res.status}`);
  return res.json();
}

// ── Health check (debug) ────────────────────────────
export async function fetchHealth() {
  const res = await fetch(`${PIPELINE_URL}/v1/health`, { headers: authHeaders() });
  return res.json();
}
