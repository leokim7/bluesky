// ────────────────────────────────────────────────────
// Inverse Distance Weighting (IDW) interpolation
// 격자 점 데이터를 픽셀 단위로 부드럽게 보간
// ────────────────────────────────────────────────────
export type GridPoint = { lng: number; lat: number; value: number | null };

/**
 * 단일 픽셀의 값을 가까운 격자 점 들의 가중 평균으로 계산.
 * maxRadius 는 격자 step 의 3-5배가 적정 (너무 작으면 원형 bubble 패턴 발생).
 */
export function idwInterpolate(
  lng: number,
  lat: number,
  points: GridPoint[],
  power = 1.5,
  maxRadius = 8, // 매우 넓게 — 모든 격자점이 항상 보간에 참여
): number | null {
  let weightSum = 0;
  let valueSum = 0;
  let nonNullCount = 0;

  // 가까운 점부터 K nearest neighbor 효과로 처리 (전체 격자 사용 + power 감쇠)
  for (const p of points) {
    if (p.value === null) continue;
    const dx = p.lng - lng;
    const dy = p.lat - lat;
    const d2 = dx * dx + dy * dy;

    if (d2 < 1e-10) return p.value;                  // 정확히 같은 점
    if (d2 > maxRadius * maxRadius) continue;

    // power 낮춤 → 부드러운 그라데이션
    const w = 1 / Math.pow(d2, power / 2);
    weightSum += w;
    valueSum += w * p.value;
    nonNullCount++;
  }

  if (nonNullCount === 0 || weightSum === 0) return null;
  return valueSum / weightSum;
}
