// ────────────────────────────────────────────────────
// Common types
// ────────────────────────────────────────────────────

export type LngLat = { lng: number; lat: number };

export type ModelId = "ensemble" | "ecmwf" | "gfs";

export type LayerId =
  | "wind"
  | "gust"
  | "temp"
  | "rain"
  | "rainAccum"
  | "clouds"
  | "storm"
  | "pressure"
  | "humidity"
  | "visibility"
  | "waves"
  // Phase 3 (locked)
  | "radar"
  | "satellite"
  | "hurricane"
  | "lightning";

export type LayerCategory = "weather" | "thunder" | "marine" | "imagery";

export type LayerDef = {
  id: LayerId;
  label: string;
  short: string;             // sidebar 짧은 라벨
  category: LayerCategory;
  enabled: boolean;          // false 면 잠금 (Phase 3 외부 데이터 필요)
  unit: string;              // 표시 단위
  variable?: string;         // /v1/weather 의 변수명 (활성 시)
  source?: string;           // 데이터 출처 표시
  particles?: boolean;       // 풍속 streamlines 같은 애니메이션
};

export type WeatherPoint = {
  lat: number;
  lon: number;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
    cloud_cover: number;
    precipitation: number;
    visibility: number;
    cape: number;
  };
};

export type PipelineResponse<T> = {
  source: string;
  lat: number;
  lon: number;
  fetched_at: string;
  cache_hit: boolean;
  ttl_seconds: number;
  data: T;
  error?: string | null;
  schema_version: string;
};
