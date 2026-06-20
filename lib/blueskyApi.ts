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
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Pipeline /v1/weather ${res.status}`);
  return res.json();
}

// ── 격자 (multi-coord) bulk ─────────────────────────
// 여러 좌표를 동시성 제한 + in-memory 캐시로 호출 (브라우저 ERR_INSUFFICIENT_RESOURCES 방지)
export type GridPoint = LngLat & { value: number | null };

const MAX_CONCURRENT = 12;             // HTTP/2 multiplexing 활용 (브라우저 6 connection × 2 stream)
const POINT_CACHE = new Map<string, unknown>();
const CACHE_TTL_MS = 30 * 60 * 1000;   // 30분 — Open-Meteo nowcast 갱신 주기 고려
const CACHE_TIMES = new Map<string, number>();
const LS_PREFIX = "bluesky:wcache:v1:";
const LS_TIME_PREFIX = "bluesky:wtime:v1:";
const HAS_LS = typeof window !== "undefined" && !!window.localStorage;

function cacheKey(lat: number, lon: number, days: number) {
  return `${lat.toFixed(3)}:${lon.toFixed(3)}:${days}`;
}

// Hydrate from localStorage on first access (page reload 시 즉시 데이터)
function hydrateFromLS(key: string): unknown | null {
  if (!HAS_LS) return null;
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    const t = parseInt(window.localStorage.getItem(LS_TIME_PREFIX + key) ?? "0", 10);
    if (!raw || !t) return null;
    if (Date.now() - t > CACHE_TTL_MS) {
      window.localStorage.removeItem(LS_PREFIX + key);
      window.localStorage.removeItem(LS_TIME_PREFIX + key);
      return null;
    }
    return JSON.parse(raw);
  } catch { return null; }
}

function persistToLS(key: string, data: unknown) {
  if (!HAS_LS) return;
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
    window.localStorage.setItem(LS_TIME_PREFIX + key, String(Date.now()));
  } catch {
    // quota exceeded 시 가장 오래된 항목 삭제 (간단 LRU)
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k?.startsWith(LS_PREFIX)) keys.push(k);
      }
      if (keys.length > 0) {
        // 가장 오래된 절반 제거
        keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => {
          const tkey = LS_TIME_PREFIX + k.slice(LS_PREFIX.length);
          window.localStorage.removeItem(k);
          window.localStorage.removeItem(tkey);
        });
      }
    } catch { /* ignore */ }
  }
}

async function fetchWithCache(lat: number, lon: number, signal?: AbortSignal) {
  const key = cacheKey(lat, lon, 7);
  const now = Date.now();
  const t = CACHE_TIMES.get(key) ?? 0;

  // L1 — in-memory (즉시)
  if (POINT_CACHE.has(key) && now - t < CACHE_TTL_MS) {
    return POINT_CACHE.get(key);
  }

  // L2 — localStorage (페이지 reload 시 즉시 활용)
  const ls = hydrateFromLS(key);
  if (ls) {
    POINT_CACHE.set(key, ls);
    CACHE_TIMES.set(key, now);
    return ls;
  }

  // L3 — network (Pipeline → Open-Meteo)
  const r = await fetchWeatherPoint(lat, lon, { signal });
  POINT_CACHE.set(key, r);
  CACHE_TIMES.set(key, now);
  persistToLS(key, r);
  return r;
}

async function pLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<unknown>) {
  const results: unknown[] = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function fetchGrid(
  coords: LngLat[],
  variable: string,
  hour: number,
  signal?: AbortSignal,
): Promise<GridPoint[]> {
  const results = await pLimit(coords, MAX_CONCURRENT, async (c) => {
    try {
      const r = await fetchWithCache(c.lat, c.lng, signal) as {
        data?: {
          current?: Record<string, unknown>;
          hourly?: { time?: string[]; [k: string]: unknown };
        };
      };
      const d = r.data ?? {};
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
  return results as GridPoint[];
}

// ── Marine (Stormglass) ─────────────────────────────
export async function fetchMarinePoint(
  lat: number,
  lon: number,
  signal?: AbortSignal,
) {
  const url = `${PIPELINE_URL}/v1/marine?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
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
  const res = await fetch(url, { headers: authHeaders(), signal, next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`Pipeline /v1/ensemble ${res.status}`);
  return res.json();
}

// ── Health check (debug) ────────────────────────────
export async function fetchHealth() {
  const res = await fetch(`${PIPELINE_URL}/v1/health`, { headers: authHeaders() });
  return res.json();
}
