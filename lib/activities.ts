// ────────────────────────────────────────────────────
// 8 Activities — BlueMatrix 통합 정의
// ────────────────────────────────────────────────────
import {
  Flag, Fish, Sailboat, Waves, Mountain, Bike, Tent, Anchor,
  type LucideIcon,
} from "lucide-react";

export type ActivityId =
  | "golf"
  | "fishing"
  | "sailing"
  | "surfing"
  | "hiking"
  | "cycling"
  | "camping"
  | "diving";

export type Activity = {
  id: ActivityId;
  ko: string;
  en: string;
  icon: LucideIcon;
  color: string;       // marker 컬러
  category: "land" | "marine" | "mixed";
};

export const ACTIVITIES: Activity[] = [
  { id: "golf",    ko: "골프",    en: "Golf",    icon: Flag,     color: "#22C55E", category: "land"   },
  { id: "fishing", ko: "낚시",    en: "Fishing", icon: Fish,     color: "#3B82F6", category: "marine" },
  { id: "sailing", ko: "세일링",  en: "Sailing", icon: Sailboat, color: "#06B6D4", category: "marine" },
  { id: "surfing", ko: "서핑",    en: "Surfing", icon: Waves,    color: "#0EA5E9", category: "marine" },
  { id: "hiking",  ko: "하이킹",  en: "Hiking",  icon: Mountain, color: "#A16207", category: "land"   },
  { id: "cycling", ko: "사이클",  en: "Cycling", icon: Bike,     color: "#F59E0B", category: "land"   },
  { id: "camping", ko: "캠핑",    en: "Camping", icon: Tent,     color: "#84CC16", category: "land"   },
  { id: "diving",  ko: "다이빙",  en: "Diving",  icon: Anchor,   color: "#7C3AED", category: "marine" },
];

export function getActivity(id: ActivityId): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}
