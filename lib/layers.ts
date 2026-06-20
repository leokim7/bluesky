// ────────────────────────────────────────────────────
// Layer registry — Windy 스타일 16개 레이어
// Active (12 — Phase 1+2)  ·  Locked (4 — Phase 3)
// ────────────────────────────────────────────────────
import type { LayerDef } from "./types";

export const LAYERS: LayerDef[] = [
  // ── Imagery (locked — Phase 3 외부 데이터 필요) ──
  {
    id: "radar",
    label: "Weather radar",
    short: "Radar",
    category: "imagery",
    enabled: false,
    unit: "dBZ",
    source: "KMA Radar (Phase 3)",
  },
  {
    id: "satellite",
    label: "Satellite",
    short: "Satellite",
    category: "imagery",
    enabled: false,
    unit: "—",
    source: "GK-2A 천리안 (Phase 3)",
  },

  // ── Active Weather Layers (Phase 1) ──
  {
    id: "wind",
    label: "Wind",
    short: "Wind",
    category: "weather",
    enabled: true,
    unit: "m/s",
    variable: "wind_speed_10m",
    source: "BlueMatrix L2 · Open-Meteo + Ensemble",
    particles: true,
  },
  {
    id: "gust",
    label: "Wind gust",
    short: "Gust",
    category: "weather",
    enabled: true,
    unit: "m/s",
    variable: "wind_gusts_10m",
    source: "BlueMatrix L2 · ECMWF i10fg + GFS GUST",
    particles: false,
  },
  {
    id: "rain",
    label: "Rain, thunder",
    short: "Rain",
    category: "weather",
    enabled: true,
    unit: "mm/h",
    variable: "precipitation",
    source: "BlueMatrix L2 · Open-Meteo",
  },
  {
    id: "rainAccum",
    label: "Rain accumulation",
    short: "Accum",
    category: "weather",
    enabled: true,
    unit: "mm",
    variable: "precipitation_sum",
    source: "BlueMatrix L2 · daily sum",
  },
  {
    id: "temp",
    label: "Temperature",
    short: "Temp",
    category: "weather",
    enabled: true,
    unit: "°C",
    variable: "temperature_2m",
    source: "BlueMatrix L2 · ECMWF 2t + GFS TMP",
  },
  {
    id: "clouds",
    label: "Clouds",
    short: "Clouds",
    category: "weather",
    enabled: true,
    unit: "%",
    variable: "cloud_cover",
    source: "BlueMatrix L2 · ECMWF tcc + GFS TCDC",
  },
  {
    id: "storm",
    label: "Thunderstorms",
    short: "Storm",
    category: "thunder",
    enabled: true,
    unit: "J/kg",
    variable: "cape",
    source: "BlueMatrix L2 · Ensemble CAPE",
  },

  // ── Locked Severe Weather ──
  {
    id: "hurricane",
    label: "Hurricane track",
    short: "Hurricane",
    category: "thunder",
    enabled: false,
    unit: "—",
    source: "KMA 태풍 정보 (Phase 3)",
  },
  {
    id: "lightning",
    label: "Lightning",
    short: "Lightning",
    category: "thunder",
    enabled: false,
    unit: "strike",
    source: "KMA 낙뢰 관측 (Phase 3)",
  },

  // ── Phase 2 추가 (Pipeline 확장 후) ──
  {
    id: "pressure",
    label: "Pressure",
    short: "Pressure",
    category: "weather",
    enabled: true,
    unit: "hPa",
    variable: "pressure_msl",
    source: "BlueMatrix L2 · ECMWF msl + GFS PRMSL",
  },
  {
    id: "humidity",
    label: "Humidity",
    short: "Humidity",
    category: "weather",
    enabled: true,
    unit: "%",
    variable: "relative_humidity_2m",
    source: "BlueMatrix L2 · Open-Meteo r2m",
  },
  {
    id: "visibility",
    label: "Visibility",
    short: "Visibility",
    category: "weather",
    enabled: true,
    unit: "km",
    variable: "visibility",
    source: "BlueMatrix L2 · Open-Meteo vis",
  },

  // ── Marine ──
  {
    id: "waves",
    label: "Waves",
    short: "Waves",
    category: "marine",
    enabled: true,
    unit: "m",
    variable: "wave_height",
    source: "BlueMatrix L2 · Stormglass swh",
  },
];

export const ACTIVE_LAYERS = LAYERS.filter((l) => l.enabled);
export const LOCKED_LAYERS = LAYERS.filter((l) => !l.enabled);

export function getLayer(id: string): LayerDef | undefined {
  return LAYERS.find((l) => l.id === id);
}
