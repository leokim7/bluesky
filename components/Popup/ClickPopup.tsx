"use client";

import { useEffect, useState } from "react";
import { fetchWeatherPoint } from "@/lib/blueskyApi";
import { X, MapPin } from "lucide-react";

type WeatherCurrent = {
  temperature_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  cape: number;
  cloud_cover: number;
  precipitation: number;
  pressure_msl: number;
  relative_humidity_2m: number;
  visibility: number;
};

type Props = {
  point: { lng: number; lat: number };
  onClose: () => void;
};

export function ClickPopup({ point, onClose }: Props) {
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchWeatherPoint(point.lat, point.lng)
      .then((r) => {
        if (!alive) return;
        const d = r.data as { current?: WeatherCurrent };
        setWeather(d.current ?? null);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [point]);

  return (
    <div
      className="absolute z-40 bg-bg-1/95 backdrop-blur-md border border-white/8 rounded-xl shadow-xl text-zinc-200 text-sm"
      style={{ top: 70, right: 250, width: 280 }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-accent-cyan" />
          <span className="font-mono text-[11px]">{point.lat.toFixed(3)}, {point.lng.toFixed(3)}</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <div className="p-3">
        {loading ? (
          <div className="text-zinc-500 text-[11px]">Loading from BlueMatrix L2…</div>
        ) : weather ? (
          <div className="space-y-1.5 text-[12px]">
            <Row label="기온" value={`${weather.temperature_2m.toFixed(1)} °C`} />
            <Row label="풍속" value={`${weather.wind_speed_10m.toFixed(1)} m/s`} accent />
            <Row label="돌풍" value={`${weather.wind_gusts_10m.toFixed(1)} m/s`} />
            <Row label="강수" value={`${weather.precipitation.toFixed(1)} mm`} />
            <Row label="구름" value={`${weather.cloud_cover}%`} />
            <Row label="기압" value={`${weather.pressure_msl.toFixed(0)} hPa`} />
            <Row label="습도" value={`${weather.relative_humidity_2m}%`} />
            <Row label="CAPE" value={`${weather.cape.toFixed(0)} J/kg`} accent={weather.cape > 1000} />
          </div>
        ) : (
          <div className="text-zinc-500 text-[11px]">No data.</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-mono ${accent ? "text-accent-cyan font-bold" : "text-zinc-200"}`}>{value}</span>
    </div>
  );
}
