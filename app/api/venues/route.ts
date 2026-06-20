// ────────────────────────────────────────────────────
// Server-side proxy — admin.bmatrix.io 의 venues public API.
// X-API-Key 헤더는 서버 측에서만 첨부 (클라이언트 노출 금지).
// 키 없거나 admin 응답 실패 시 — 빈 배열 반환 → 클라이언트가 fallback 사용.
// ────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = process.env.ADMIN_API_BASE || "https://admin-dev.bmatrix.io";
const KEY = process.env.ADMIN_API_KEY || "";

// AdminVenue (admin.bmatrix.io API 응답 형식 — Bluematrix_2 의 lib/adminApi.ts 동일)
type AdminVenue = {
  id: string;
  activity_type: string;
  name: string;
  region: string | null;
  lat: number;
  lon: number;
  verified?: boolean;
  source?: string;
  meta?: Record<string, unknown> | null;
  status?: string;
};

type AdminResponse = {
  ok: boolean;
  count?: number;
  data?: AdminVenue[];
  error?: string;
};

// 우리 클라이언트가 기대하는 형식
type ClientVenue = {
  id: string;
  name: string;
  activity: string;
  lat: number;
  lon: number;
  address?: string | null;
};

function emptyResponse() {
  return NextResponse.json({ venues: [], source: "fallback" });
}

export async function GET(req: NextRequest) {
  const activity = req.nextUrl.searchParams.get("activity");
  if (!activity) {
    return NextResponse.json({ venues: [], error: "missing activity" }, { status: 400 });
  }

  // 키 없으면 즉시 빈 응답 → 클라이언트가 fallback 사용
  if (!KEY) {
    console.warn("[bluesky/api/venues] ADMIN_API_KEY 미설정 — fallback 사용");
    return emptyResponse();
  }

  try {
    const url = `${BASE}/api/public/venues?activity=${encodeURIComponent(activity)}`;
    const r = await fetch(url, {
      headers: { "X-API-Key": KEY },
      next: { revalidate: 1800 }, // 30분 ISR
    });

    if (!r.ok) {
      console.error(`[bluesky/api/venues] admin ${r.status}: ${url}`);
      return emptyResponse();
    }

    const json = (await r.json()) as AdminResponse;
    if (!json.ok || !Array.isArray(json.data) || json.data.length === 0) {
      return emptyResponse();
    }

    // AdminVenue → ClientVenue 변환
    const venues: ClientVenue[] = json.data.map((av) => ({
      id: av.id,
      name: av.name,
      activity: av.activity_type,
      lat: av.lat,
      lon: av.lon,
      address: av.region ?? undefined,
    }));

    return NextResponse.json({
      venues,
      source: "admin",
      count: venues.length,
    });
  } catch (e) {
    console.error("[bluesky/api/venues] fetch failed:", (e as Error).message);
    return emptyResponse();
  }
}
