// ────────────────────────────────────────────────────
// Venue 데이터 — BlueMatrix admin API + 최소 fallback
// ────────────────────────────────────────────────────
import type { ActivityId } from "./activities";

export type Venue = {
  id: string;
  name: string;
  activity: ActivityId;
  lat: number;
  lon: number;
  address?: string;
  description?: string;
};

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "https://admin-dev.bmatrix.io";

// ── In-memory cache ─────────────────────────────────
const CACHE = new Map<ActivityId, { ts: number; venues: Venue[] }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 분

/** Admin API 에서 활동별 venue 조회. 실패 시 fallback 사용. */
export async function fetchVenuesByActivity(activity: ActivityId): Promise<Venue[]> {
  const cached = CACHE.get(activity);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.venues;

  try {
    const res = await fetch(`${ADMIN_URL}/api/public/venues?activity=${activity}`, {
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const j = (await res.json()) as { venues?: Venue[] };
      const venues = (j.venues ?? []).map((v) => ({ ...v, activity }));
      if (venues.length > 0) {
        CACHE.set(activity, { ts: Date.now(), venues });
        return venues;
      }
    }
  } catch {
    // continue to fallback
  }
  const venues = FALLBACK_VENUES[activity] ?? [];
  CACHE.set(activity, { ts: Date.now(), venues });
  return venues;
}

// ── Fallback / Seed venues (admin API 없을 때) ──────
const FALLBACK_VENUES: Record<ActivityId, Venue[]> = {
  golf: [
    { id: "g-1",  name: "안양 베네스트 GC",    activity: "golf", lat: 37.40, lon: 126.92, address: "경기 안양시" },
    { id: "g-2",  name: "남촌 CC",             activity: "golf", lat: 37.32, lon: 127.10, address: "경기 광주" },
    { id: "g-3",  name: "남부 CC",             activity: "golf", lat: 37.32, lon: 127.18, address: "경기 광주" },
    { id: "g-4",  name: "해비치 GC",           activity: "golf", lat: 33.36, lon: 126.84, address: "제주 표선" },
    { id: "g-5",  name: "스카이힐 CC",         activity: "golf", lat: 33.45, lon: 126.66, address: "제주 제주시" },
    { id: "g-6",  name: "라온 GC",             activity: "golf", lat: 33.40, lon: 126.32, address: "제주 한경" },
    { id: "g-7",  name: "오크밸리 CC",         activity: "golf", lat: 37.35, lon: 127.84, address: "강원 원주" },
    { id: "g-8",  name: "버치힐 GC",           activity: "golf", lat: 37.66, lon: 127.68, address: "경기 가평" },
  ],
  fishing: [
    { id: "f-1",  name: "서천 홍원항",          activity: "fishing", lat: 36.05, lon: 126.62, address: "충남 서천" },
    { id: "f-2",  name: "보령 대천항",          activity: "fishing", lat: 36.31, lon: 126.51, address: "충남 보령" },
    { id: "f-3",  name: "인천 연안부두",        activity: "fishing", lat: 37.45, lon: 126.61, address: "인천 중구" },
    { id: "f-4",  name: "통영 욕지도",          activity: "fishing", lat: 34.62, lon: 128.27, address: "경남 통영" },
    { id: "f-5",  name: "여수 거문도",          activity: "fishing", lat: 34.03, lon: 127.31, address: "전남 여수" },
    { id: "f-6",  name: "제주 차귀도",          activity: "fishing", lat: 33.31, lon: 126.16, address: "제주 한경" },
  ],
  sailing: [
    { id: "s-1",  name: "전곡 마리나",          activity: "sailing", lat: 37.18, lon: 126.65, address: "경기 화성" },
    { id: "s-2",  name: "왕산 마리나",          activity: "sailing", lat: 37.43, lon: 126.36, address: "인천 중구" },
    { id: "s-3",  name: "수영만 요트경기장",    activity: "sailing", lat: 35.16, lon: 129.13, address: "부산 해운대" },
    { id: "s-4",  name: "통영 이순신 마리나",   activity: "sailing", lat: 34.84, lon: 128.42, address: "경남 통영" },
    { id: "s-5",  name: "양양 수산항",          activity: "sailing", lat: 38.07, lon: 128.62, address: "강원 양양" },
  ],
  surfing: [
    { id: "sf-1", name: "양양 죽도해변",        activity: "surfing", lat: 38.10, lon: 128.66, address: "강원 양양" },
    { id: "sf-2", name: "양양 인구해변",        activity: "surfing", lat: 38.04, lon: 128.62, address: "강원 양양" },
    { id: "sf-3", name: "고성 송지호해변",      activity: "surfing", lat: 38.34, lon: 128.51, address: "강원 고성" },
    { id: "sf-4", name: "부산 송정해변",        activity: "surfing", lat: 35.18, lon: 129.20, address: "부산 해운대" },
    { id: "sf-5", name: "제주 중문색달해변",    activity: "surfing", lat: 33.24, lon: 126.41, address: "제주 서귀포" },
  ],
  hiking: [
    { id: "h-1",  name: "북한산 (북한산성)",    activity: "hiking", lat: 37.66, lon: 126.97, address: "서울 강북" },
    { id: "h-2",  name: "설악산 (소공원)",      activity: "hiking", lat: 38.12, lon: 128.46, address: "강원 속초" },
    { id: "h-3",  name: "지리산 (성삼재)",      activity: "hiking", lat: 35.32, lon: 127.55, address: "전남 구례" },
    { id: "h-4",  name: "한라산 (성판악)",      activity: "hiking", lat: 33.40, lon: 126.61, address: "제주 제주시" },
    { id: "h-5",  name: "월악산 (덕주사)",      activity: "hiking", lat: 36.85, lon: 128.12, address: "충북 제천" },
    { id: "h-6",  name: "내장산 (대가람)",      activity: "hiking", lat: 35.49, lon: 126.88, address: "전북 정읍" },
  ],
  cycling: [
    { id: "c-1",  name: "한강 자전거길",        activity: "cycling", lat: 37.52, lon: 127.00, address: "서울 마포" },
    { id: "c-2",  name: "남한강 자전거길",      activity: "cycling", lat: 37.55, lon: 127.36, address: "경기 양평" },
    { id: "c-3",  name: "낙동강 자전거길",      activity: "cycling", lat: 35.32, lon: 128.96, address: "경남 양산" },
    { id: "c-4",  name: "제주 환상자전거길",    activity: "cycling", lat: 33.50, lon: 126.53, address: "제주 제주시" },
    { id: "c-5",  name: "북한강 자전거길",      activity: "cycling", lat: 37.74, lon: 127.41, address: "경기 가평" },
  ],
  camping: [
    { id: "cp-1", name: "가평 자라섬 캠핑장",   activity: "camping", lat: 37.81, lon: 127.51, address: "경기 가평" },
    { id: "cp-2", name: "양양 송이향기 캠핑장", activity: "camping", lat: 38.07, lon: 128.62, address: "강원 양양" },
    { id: "cp-3", name: "강원 평창 알펜시아",   activity: "camping", lat: 37.65, lon: 128.67, address: "강원 평창" },
    { id: "cp-4", name: "전북 무주 덕유산",     activity: "camping", lat: 35.86, lon: 127.74, address: "전북 무주" },
    { id: "cp-5", name: "제주 신화 캠핑장",     activity: "camping", lat: 33.31, lon: 126.40, address: "제주 안덕" },
  ],
  diving: [
    { id: "d-1",  name: "강원 양양 다이브존",   activity: "diving", lat: 38.05, lon: 128.65, address: "강원 양양" },
    { id: "d-2",  name: "제주 서귀포 문섬",     activity: "diving", lat: 33.22, lon: 126.55, address: "제주 서귀포" },
    { id: "d-3",  name: "제주 우도",            activity: "diving", lat: 33.50, lon: 126.94, address: "제주 우도" },
    { id: "d-4",  name: "통영 욕지도",          activity: "diving", lat: 34.62, lon: 128.27, address: "경남 통영" },
    { id: "d-5",  name: "전남 가거도",          activity: "diving", lat: 34.06, lon: 125.10, address: "전남 신안" },
  ],
};
