"use client";

import { useEffect, useState } from "react";
import type { Venue } from "@/lib/venues";
import { getActivity } from "@/lib/activities";
import { fetchWeatherPoint, fetchMarinePoint } from "@/lib/blueskyApi";
import { X, MapPin, ExternalLink, Thermometer, Wind, Droplets, Activity as ActivityIcon } from "lucide-react";

type Props = {
  venue: Venue;
  onClose: () => void;
};

type WeatherCurrent = {
  temperature_2m: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  wind_direction_10m: number;
  relative_humidity_2m: number;
  cape: number;
  cloud_cover: number;
  precipitation: number;
  pressure_msl: number;
  weather_code: number;
};

type MarineHour = {
  waveHeight?: { sg?: number };
  wavePeriod?: { sg?: number };
  waterTemperature?: { sg?: number };
};

const BLUEMATRIX_URL = "https://app-dev.bmatrix.io";

/** 활동별 점수 계산 (간소화 v1 — 8 액티비티별 룰) */
function computeScore(activity: string, w: WeatherCurrent, m?: MarineHour): number {
  let score = 80;
  // 공통: 풍속/돌풍/강수/CAPE 페널티
  if (w.wind_speed_10m > 8) score -= 15;
  if (w.wind_gusts_10m > 12) score -= 10;
  if (w.precipitation > 1) score -= 20;
  if (w.cape > 1500) score -= 15;
  if (w.cloud_cover > 85) score -= 5;
  // 활동별
  switch (activity) {
    case "golf":
    case "hiking":
    case "cycling":
    case "camping":
      // 육상 — 풍속 적정, 맑은 날씨 선호
      if (w.temperature_2m < 5 || w.temperature_2m > 32) score -= 10;
      break;
    case "surfing":
      if (m?.waveHeight?.sg) {
        const h = m.waveHeight.sg;
        if (h >= 0.8 && h <= 2.5) score += 15;
        else if (h < 0.5) score -= 20;
      }
      break;
    case "sailing":
      // 적정 풍속이 오히려 +
      if (w.wind_speed_10m >= 5 && w.wind_speed_10m <= 10) score += 10;
      break;
    case "fishing":
    case "diving":
      // 잔잔한 해상 선호
      if (m?.waveHeight?.sg && m.waveHeight.sg > 1.5) score -= 15;
      break;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreColor(s: number): string {
  if (s >= 80) return "#22C55E";
  if (s >= 60) return "#F59E0B";
  if (s >= 40) return "#F97316";
  return "#EF4444";
}

function scoreLabel(s: number): string {
  if (s >= 80) return "최적";
  if (s >= 60) return "양호";
  if (s >= 40) return "보통";
  return "주의";
}

const WIND_DIRS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
function windDir(deg: number): string {
  return WIND_DIRS[Math.round(deg / 45) % 8];
}

export function VenuePopup({ venue, onClose }: Props) {
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [marine, setMarine] = useState<MarineHour | null>(null);
  const [loading, setLoading] = useState(true);
  const activity = getActivity(venue.activity);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const isMarine = activity?.category === "marine";

    Promise.all([
      fetchWeatherPoint(venue.lat, venue.lon).catch(() => null),
      isMarine ? fetchMarinePoint(venue.lat, venue.lon).catch(() => null) : Promise.resolve(null),
    ]).then(([w, m]) => {
      if (!alive) return;
      const wData = w?.data as { current?: WeatherCurrent } | undefined;
      setWeather(wData?.current ?? null);
      const mData = m?.data as { hours?: MarineHour[] } | undefined;
      setMarine(mData?.hours?.[0] ?? null);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [venue, activity]);

  const score = weather ? computeScore(venue.activity, weather, marine ?? undefined) : null;

  return (
    <div
      className="absolute z-50 bg-bg-1/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl text-zinc-200"
      style={{ top: 90, left: 16, width: 320 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {activity && (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: activity.color }}
            >
              <activity.icon size={14} color="#0A0F1A" strokeWidth={2.5} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{venue.name}</div>
            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
              <MapPin size={9} />
              {venue.address}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="text-zinc-500 text-xs text-center py-6">
            BlueMatrix L2 데이터 로딩 중…
          </div>
        ) : !weather ? (
          <div className="text-zinc-500 text-xs text-center py-6">
            데이터를 불러올 수 없습니다.
          </div>
        ) : (
          <>
            {/* Score */}
            {score !== null && (
              <div
                className="rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between"
                style={{ background: `${scoreColor(score)}25`, border: `1px solid ${scoreColor(score)}` }}
              >
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-80">활동 점수</div>
                  <div className="text-2xl font-bold leading-none mt-0.5" style={{ color: scoreColor(score) }}>
                    {score}점
                  </div>
                </div>
                <div className="text-right">
                  <ActivityIcon size={14} className="inline mr-1" style={{ color: scoreColor(score) }} />
                  <span className="font-bold text-sm" style={{ color: scoreColor(score) }}>
                    {scoreLabel(score)}
                  </span>
                </div>
              </div>
            )}

            {/* Weather grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <Stat icon={<Thermometer size={11} />} label="기온" value={`${weather.temperature_2m.toFixed(1)}°C`} />
              <Stat icon={<Wind size={11} />}        label="풍속" value={`${weather.wind_speed_10m.toFixed(1)} m/s ${windDir(weather.wind_direction_10m)}`} />
              <Stat icon={<Wind size={11} />}        label="돌풍" value={`${weather.wind_gusts_10m.toFixed(1)} m/s`} />
              <Stat icon={<Droplets size={11} />}    label="습도" value={`${weather.relative_humidity_2m}%`} />
              <Stat icon={<Droplets size={11} />}    label="강수" value={`${weather.precipitation.toFixed(1)} mm`} />
              <Stat icon={<ActivityIcon size={11} />} label="CAPE" value={`${weather.cape.toFixed(0)} J/kg`} accent={weather.cape > 1000} />
              {marine && marine.waveHeight?.sg !== undefined && (
                <>
                  <Stat icon={<Wind size={11} />}     label="파고" value={`${marine.waveHeight.sg.toFixed(1)} m`} />
                  {marine.waterTemperature?.sg !== undefined && (
                    <Stat icon={<Droplets size={11} />} label="수온" value={`${marine.waterTemperature.sg.toFixed(1)}°C`} />
                  )}
                </>
              )}
            </div>

            {/* Open in Bluematrix */}
            <a
              href={`${BLUEMATRIX_URL}/?lat=${venue.lat}&lon=${venue.lon}&activity=${venue.activity}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent-blue hover:bg-accent-cyan text-white text-[11px] font-bold transition-colors"
            >
              BlueMatrix 에서 자세히 보기
              <ExternalLink size={11} />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent = false }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-bg-2 rounded-md px-2 py-1.5 flex items-center gap-1.5">
      <span className={accent ? "text-accent-cyan" : "text-zinc-500"}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-zinc-500 uppercase tracking-wider leading-none">{label}</div>
        <div className={`font-mono font-bold mt-0.5 truncate ${accent ? "text-accent-cyan" : "text-zinc-200"}`}>{value}</div>
      </div>
    </div>
  );
}
