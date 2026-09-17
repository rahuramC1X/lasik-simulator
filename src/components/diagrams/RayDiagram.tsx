interface RayDiagramProps {
  /** Current corneal-power value, 0-100. */
  power: number;
  /**
   * The power value that brings rays to a single point exactly on the retina
   * line. Used only to compute ray geometry — never rendered as text, so a
   * player has to find it by eye, the same way the diagram shows it.
   */
  target: number;
  /** How close counts as "in focus," in the same units as power/target. */
  tolerance?: number;
  caption?: string;
}

const CX_LENS = 210;
const CX_RETINA = 560;
const CY = 150;
const RAY_SPREAD = 52;
/** How many px the focal point moves per unit of power/target mismatch. */
const SCALE = 6;

/** Where a ray starting at `startY` (before the lens) lands once it reaches `x`. */
function rayYAt(startY: number, focalX: number, x: number): number {
  const dx = focalX - CX_LENS;
  if (Math.abs(dx) < 0.001) return CY;
  const t = (x - CX_LENS) / dx;
  return startY + (CY - startY) * t;
}

/** Optical ray-tracing diagram: shows *why* the eye blurs, not just that it does. */
export function RayDiagram({ power, target, tolerance = 14, caption }: RayDiagramProps) {
  const focalX = CX_RETINA + (target - power) * SCALE;
  const startYs = [CY - RAY_SPREAD, CY, CY + RAY_SPREAD];
  const retinaYs = startYs.map((y) => rayYAt(y, focalX, CX_RETINA));
  const spread = Math.max(...retinaYs) - Math.min(...retinaYs);
  const inFocus = Math.abs(power - target) <= tolerance;

  return (
    <div className="ray-diagram">
      <svg viewBox="0 0 640 300" className="ray-svg" role="img" aria-label="Optical focus diagram">
        {/* Simplified eye silhouette for context — full anatomy lives in Meet the Eye. */}
        <path
          d={`M${CX_LENS - 40},60 Q${CX_LENS - 130},150 ${CX_LENS - 40},240 L${CX_RETINA + 20},220 Q${CX_RETINA + 55},150 ${CX_RETINA + 20},80 Z`}
          className="ray-eye-silhouette"
        />
        <line x1={CX_RETINA} y1={55} x2={CX_RETINA} y2={245} className="ray-retina-line" />
        <text x={CX_RETINA + 10} y={264} className="ray-label">
          RETINA
        </text>

        {/* Focal-point marker and, when defocused, the resulting blur patch on the retina. */}
        {inFocus ? (
          <circle cx={CX_RETINA} cy={CY} r={6} className="ray-focus-sharp" />
        ) : (
          <ellipse cx={CX_RETINA} cy={CY} rx={5} ry={Math.min(60, Math.max(6, spread / 2))} className="ray-focus-blur" />
        )}
        {focalX > CX_LENS + 10 && focalX < CX_RETINA - 10 && (
          <circle cx={focalX} cy={CY} r={3} className="ray-focal-point" />
        )}

        {startYs.map((y, i) => (
          <polyline
            key={i}
            points={`0,${y} ${CX_LENS},${y} ${CX_RETINA},${rayYAt(y, focalX, CX_RETINA)} ${CX_RETINA + 50},${rayYAt(y, focalX, CX_RETINA + 50)}`}
            className={`ray-line${inFocus ? ' ray-line-sharp' : ''}`}
          />
        ))}

        <line x1={CX_LENS} y1={40} x2={CX_LENS} y2={260} className="ray-lens-line" />
        <text x={CX_LENS - 46} y={264} className="ray-label">
          CORNEA + LENS
        </text>
      </svg>
      {caption && <p className="ray-caption">{caption}</p>}
    </div>
  );
}
