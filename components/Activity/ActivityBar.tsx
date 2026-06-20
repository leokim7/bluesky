"use client";

import { ACTIVITIES, type ActivityId } from "@/lib/activities";
import { X } from "lucide-react";

type Props = {
  selected: ActivityId | null;
  onChange: (id: ActivityId | null) => void;
};

export function ActivityBar({ selected, onChange }: Props) {
  return (
    <div className="bg-bg-1/85 backdrop-blur-md border border-white/5 rounded-2xl px-2 py-1.5 flex items-center gap-1 shadow-xl">
      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold px-2">활동</span>

      {ACTIVITIES.map((a) => {
        const Icon = a.icon;
        const active = selected === a.id;
        return (
          <button
            key={a.id}
            onClick={() => onChange(active ? null : a.id)}
            title={a.ko}
            className={[
              "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg",
              "transition-all border",
              active
                ? "border-transparent shadow-md scale-105"
                : "border-transparent hover:bg-bg-2",
            ].join(" ")}
            style={
              active
                ? { background: a.color, color: "#0A0F1A" }
                : { color: "#94A3B8" }
            }
          >
            <Icon size={15} strokeWidth={2.2} />
            <span className="text-[9px] font-semibold leading-none">{a.ko}</span>
          </button>
        );
      })}

      {selected && (
        <button
          onClick={() => onChange(null)}
          className="ml-1 p-1.5 rounded-lg hover:bg-bg-2 text-zinc-500 hover:text-white transition-colors"
          title="선택 해제"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
