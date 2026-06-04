// Geometry helpers for collision. Pure number-in / number-out, no dependencies —
// keeps the module trivially testable and reusable. Squared distances are used in
// the hot path to avoid sqrt; callers compare against threshold-squared.

/** Squared distance from point (px,py) to segment (ax,ay)-(bx,by). */
export function pointSegmentDistanceSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  let t = abLenSq === 0 ? 0 : (apx * abx + apy * aby) / abLenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

/** Euclidean distance from point to segment. */
export function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.sqrt(pointSegmentDistanceSq(px, py, ax, ay, bx, by));
}

/** Sign of the cross product (a->b) x (b->c): +1 ccw, -1 cw, 0 collinear. */
function orient(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): number {
  const v = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

/** True if the two segments properly cross (collinear-overlap is left to the distance fn). */
export function segmentsIntersect(
  ax1: number,
  ay1: number,
  bx1: number,
  by1: number,
  ax2: number,
  ay2: number,
  bx2: number,
  by2: number,
): boolean {
  const o1 = orient(ax1, ay1, bx1, by1, ax2, ay2);
  const o2 = orient(ax1, ay1, bx1, by1, bx2, by2);
  const o3 = orient(ax2, ay2, bx2, by2, ax1, ay1);
  const o4 = orient(ax2, ay2, bx2, by2, bx1, by1);
  return o1 !== o2 && o3 !== o4;
}

/**
 * Squared minimum distance between two segments. 0 if they cross; otherwise the
 * smallest endpoint-to-segment distance (which also covers touching/collinear-overlap
 * cases, since an overlapping endpoint lies on the other segment).
 */
export function segmentSegmentDistanceSq(
  ax1: number,
  ay1: number,
  bx1: number,
  by1: number,
  ax2: number,
  ay2: number,
  bx2: number,
  by2: number,
): number {
  if (segmentsIntersect(ax1, ay1, bx1, by1, ax2, ay2, bx2, by2)) return 0;
  return Math.min(
    pointSegmentDistanceSq(ax1, ay1, ax2, ay2, bx2, by2),
    pointSegmentDistanceSq(bx1, by1, ax2, ay2, bx2, by2),
    pointSegmentDistanceSq(ax2, ay2, ax1, ay1, bx1, by1),
    pointSegmentDistanceSq(bx2, by2, ax1, ay1, bx1, by1),
  );
}
