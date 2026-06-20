# bluesky · BlueMatrix Weather Map

Windy 스타일 Multi-Model Weather Map — **BlueMatrix L2 (api-dev.bmatrix.io)** 데이터 단일 소스 사용.

- 도메인: **bluesky.bmatrix.io**
- 데이터: BlueMatrix Pipeline `/v1/*` + Admin 발급 API 키
- 스택: Next.js 15 · TypeScript · Tailwind · Mapbox GL · React 19

---

## 🗺️ 16 레이어 (Windy 스타일)

| 분류 | 레이어 | 상태 | 데이터 출처 |
| --- | --- | --- | --- |
| Imagery | Weather radar | 🔒 잠금 (Phase 3) | KMA Radar API |
| Imagery | Satellite | 🔒 잠금 (Phase 3) | GK-2A 천리안 |
| Weather | **Wind** ✅ | 활성 + 파티클 | L2 `/v1/weather` |
| Weather | **Wind gust** ✅ | 활성 | L2 `/v1/weather` wind_gusts_10m |
| Weather | Rain, thunder | 활성 | L2 `/v1/weather` precipitation |
| Weather | Rain accumulation | 활성 | L2 `/v1/weather daily` |
| Weather | Temperature | 활성 | L2 `/v1/weather` 2t |
| Weather | Clouds | 활성 | L2 `/v1/weather` cloud_cover |
| Thunder | Thunderstorms (CAPE) | 활성 | L2 `/v1/weather` cape |
| Thunder | Hurricane track | 🔒 (Phase 3) | KMA 태풍 API |
| Thunder | Lightning | 🔒 (Phase 3) | KMA 낙뢰 API |
| Weather | Pressure | 활성 | L2 `/v1/weather` pressure_msl |
| Weather | Humidity | 활성 | L2 `/v1/weather` relative_humidity_2m |
| Weather | Visibility | 활성 | L2 `/v1/weather` visibility |
| Marine | Waves | 활성 | L2 `/v1/marine` (Stormglass) |

**12 활성 + 4 잠금 = 16 레이어**

---

## 🚀 개발 시작

```bash
cp .env.example .env.local
# .env.local 에 Mapbox 토큰 입력
npm install
npm run dev
```

브라우저: <http://localhost:3010>

---

## 📁 폴더 구조

```
bluesky/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 메인 — 풀스크린 맵
│   └── globals.css
├── components/
│   ├── Brand/                # 상단 브랜드 (bluesky)
│   ├── Sidebar/              # 우측 16 레이어 사이드바
│   ├── Timeline/             # 하단 16-day scrubber
│   ├── Toolbar/              # 검색 · 모델 · 범례
│   ├── Map/
│   │   ├── BlueSkyMap.tsx    # Mapbox 컨테이너
│   │   ├── LayerRenderer.tsx # 격자 ImageSource 렌더링
│   │   └── WindParticles.tsx # 풍속 streamlines
│   └── Popup/
│       └── ClickPopup.tsx    # 지도 클릭 위치 weather
├── lib/
│   ├── blueskyApi.ts         # L2 Pipeline client (X-API-Key)
│   ├── layers.ts             # 16 레이어 정의 (활성 + 잠금)
│   ├── colorPalettes.ts      # Windy 스타일 컬러 팔레트
│   ├── idw.ts                # IDW interpolation
│   └── types.ts
├── amplify.yml
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🔑 환경 변수

| Key | 용도 | Dev | Production |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_PIPELINE_API_URL` | L2 Pipeline base URL | `api-dev.bmatrix.io` | `api.bmatrix.io` |
| `NEXT_PUBLIC_BLUESKY_API_KEY` | Admin 발급 키 | 빈 값 가능 | 필수 (`X-API-Key`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token | 필수 | 필수 |

---

## 🎯 차별점 (vs Windy)

| 항목 | Windy | bluesky |
| --- | --- | --- |
| Ensemble | 단일 모델 (ECMWF or GFS) | **ECMWF + GFS 가중 평균 + confidence** |
| 한국 데이터 | 일반 모델만 | KMA · KHOA · AirKorea (확장) |
| 활용 영역 | B2C | **B2B SaaS 데모 · API 통합** |
| API 직접 호출 | 유료 (Premium) | **api-dev.bmatrix.io** 자체 |

---

## 📋 다음 단계

- [ ] Phase 1 마무리 — 모든 활성 12 레이어 검증
- [ ] Phase 2 마무리 — Altitude (등압면) 선택 UI · isobars
- [ ] Phase 3 — Radar · Satellite · Hurricane · Lightning 외부 데이터 통합
- [ ] AWS Amplify 배포 (`bluesky.bmatrix.io`)
