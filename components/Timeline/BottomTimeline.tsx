"use client";

import { useMemo } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  hourOffset: number;
  onChange: (h: number) => void;
};

const MAX_HOURS = 15 * 24; // 15-day window

function formatDate(d: Date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}
function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

export function BottomTimeline({ hourOffset, onChange }: Props) {
  const targetTime = useMemo(() => {
    const t = new Date();
    t.setMinutes(0, 0, 0);
    t.setHours(t.getHours() + hourOffset);
    return t;
  }, [hourOffset]);

  const ticks = useMemo(() => {
    const arr: { h: number; date: Date; major: boolean }[] = [];
    for (let h = 0; h <= MAX_HOURS; h += 12) {
      const t = new Date();
      t.setMinutes(0, 0, 0);
      t.setHours(t.getHours() + h);
      arr.push({ h, date: t, major: h % 24 === 0 });
    }
    return arr;
  }, []);

  return (
    <div className="timeline-track flex items-center gap-3">
      {/* Play button */}
      <button className="w-9 h-9 rounded-full bg-accent-blue text-white flex items-center justify-center hover:bg-accent-cyan transition-colors">
        <Play size={14} className="ml-0.5" />
      </button>

      {/* Prev */}
      <button
        onClick={() => onChange(Math.max(0, hourOffset - 1))}
        className="w-7 h-7 rounded-full bg-bg-2 hover:bg-bg-1 flex items-center justify-center text-zinc-400"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Current time display */}
      <div className="px-3 py-1 rounded bg-bg-2 min-w-[140px] text-center">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{formatDate(targetTime)}</div>
        <div className="text-sm font-mono font-bold text-accent-cyan">{formatTime(targetTime)}</div>
      </div>

      {/* Next */}
      <button
        onClick={() => onChange(Math.min(MAX_HOURS, hourOffset + 1))}
        className="w-7 h-7 rounded-full bg-bg-2 hover:bg-bg-1 flex items-center justify-center text-zinc-400"
      >
        <ChevronRight size={14} />
      </button>

      {/* Slider */}
      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={MAX_HOURS}
          value={hourOffset}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none h-1 rounded-full bg-bg-2 cursor-pointer accent-accent-cyan"
        />
        {/* Day labels */}
        <div className="flex justify-between mt-1 px-0.5 text-[9px] text-zinc-500 select-none">
          {ticks.filter((t) => t.major).map((t, i, arr) => {
            if (i % Math.ceil(arr.length / 8) !== 0 && i !== arr.length - 1) return null;
            return (
              <span key={t.h} className={t.h === hourOffset ? "timeline-tick is-now" : "timeline-tick"}>
                {formatDate(t.date)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Reset to now */}
      <button
        onClick={() => onChange(0)}
        className="px-2 py-1 text-[10px] rounded bg-bg-2 hover:bg-accent-blue hover:text-white text-zinc-400 transition-colors"
      >
        NOW
      </button>
    </div>
  );
}
