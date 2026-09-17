interface AstigmatismDiagramProps {
  /** Current axis dial value, 0-180 degrees. */
  axis: number;
  /** The axis that produces a round, sharp point — never rendered as text. */
  target: number;
  caption?: string;
}

const CX_LENS = 210;
const CX_RETINA = 470;
const CY = 150;
const BASE_R = 30;

/** Shortest angular distance between two axes, 0-180 wrap-aware. */
function axisError(a: number, b: number): number {
  const raw = Math.abs(a - b) % 180;
  return Math.min(raw, 180 - raw);
}

/**
 * Astigmatism doesn't focus to one point — it focuses along two lines at
 * right angles. This diagram shows the resulting blur as a stretched ellipse
 * that rounds into a sharp point once the corrective axis matches.
 */
export function AstigmatismDiagram({ axis, target, caption }: AstigmatismDiagramProps) {
  const error = axisError(axis, target); // 0..90
  const stretch = error / 90; // 0 = perfectly round, 1 = maximally stretched
  const rx = BASE_R * (1 + stretch * 1.6);
  const ry = BASE_R * (1 - stretch * 0.55);
  const sharp = error < 6;

  return (
    <div className="ray-diagram">
      <svg viewBox="0 0 560 300" className="ray-svg" role="img" aria-label="Astigmatism axis diagram">
        <path
          d={`M${CX_LENS - 40},60 Q${CX_LENS - 130},150 ${CX_LENS - 40},240 L${CX_RETINA + 20},220 Q${CX_RETINA + 55},150 ${CX_RETINA + 20},80 Z`}
          className="ray-eye-silhouette"
        />
        <line x1={CX_RETINA} y1={55} x2={CX_RETINA} y2={245} className="ray-retina-line" />
        <text x={CX_RETINA + 10} y={264} className="ray-label">
          RETINA
        </text>

        {/* Corrective axis indicator — a dashed diameter line rotated to the dial value. */}
        <g transform={`translate(${CX_LENS} ${CY}) rotate(${axis})`} className="axis-indicator">
          <line x1={-34} y1={0} x2={34} y2={0} />
        </g>

        <ellipse
          cx={CX_RETINA}
          cy={CY}
          rx={rx}
          ry={ry}
          transform={`rotate(${axis} ${CX_RETINA} ${CY})`}
          className={sharp ? 'ray-focus-sharp astig-sharp' : 'ray-focus-blur'}
        />

        <line x1={CX_LENS} y1={40} x2={CX_LENS} y2={260} className="ray-lens-line" />
        <text x={CX_LENS - 26} y={264} className="ray-label">
          CORNEA
        </text>
      </svg>
      {caption && <p className="ray-caption">{caption}</p>}
    </div>
  );
}
