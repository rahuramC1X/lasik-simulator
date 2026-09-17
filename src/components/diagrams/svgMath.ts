/** Small helpers for building anatomically-laid-out SVG paths without hand-typed magic numbers. */

export interface Point {
  x: number;
  y: number;
}

/** A point on an ellipse at the given angle (degrees, 0 = +x axis, clockwise in SVG's y-down space). */
export function ellipsePoint(cx: number, cy: number, rx: number, ry: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

/**
 * An SVG elliptical-arc path 'd' string from `fromDeg` to `toDeg`, sweeping
 * clockwise (sweep=1) or counter-clockwise (sweep=0). The large-arc-flag is
 * derived automatically from the sweep direction so the arc always goes the
 * way you'd expect from the two angles, not just "the short way."
 */
export function arcPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fromDeg: number,
  toDeg: number,
  sweep: 0 | 1 = 1,
): string {
  const p1 = ellipsePoint(cx, cy, rx, ry, fromDeg);
  const p2 = ellipsePoint(cx, cy, rx, ry, toDeg);
  const delta = sweep === 1 ? ((toDeg - fromDeg + 360) % 360) : ((fromDeg - toDeg + 360) % 360);
  const large = delta > 180 ? 1 : 0;
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} A${rx},${ry} 0 ${large},${sweep} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
}
