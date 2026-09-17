/**
 * A corneal curvature map, the way a topographer draws one: warm colours are
 * steeper, cool colours flatter. Regular astigmatism is modelled to first
 * order as curvature varying with the meridian —
 *
 *     K(θ) = Kmean + (ΔK / 2) · cos(2(θ − steep meridian))
 *
 * — which is what produces the familiar "bowtie": two warm lobes facing each
 * other along the steep meridian, cool ones 90° away. Drop ΔK to zero and the
 * map goes uniformly green, which is the whole point of the cylinder panel.
 *
 * Teaching diagram, not a clinical map: no real elevation data, no real
 * scale, and a real cornea is never this tidy.
 */

interface CornealTopographyProps {
  /** Remaining astigmatism, in dioptres — the difference between the steep and flat meridians. */
  deltaK: number;
  /** The steep meridian, in degrees (0-180). */
  steepMeridian: number;
  /** Average corneal power, in dioptres — sets the middle of the colour scale. */
  meanK: number;
  /**
   * Whether to print the numeric K difference. Off while the player is still
   * working the map out — a live "0.00 D" readout would turn a visual puzzle
   * into a game of watching a number.
   */
  showReadout?: boolean;
  caption?: string;
}

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 122;
const RINGS = 5;
const WEDGES = 24;
const INNER = 0.05;

/**
 * Dioptres either side of meanK that the colour scale spans. Deliberately
 * narrow: a real topographer's scale is chosen to make the pattern readable,
 * and a scale wide enough to never saturate would render this case as a
 * uniform green disc with a faint tint — the opposite of the point.
 */
const SCALE_SPAN = 1.9;

const RAMP: readonly { at: number; hex: string }[] = [
  { at: -1, hex: '#1d4ed8' },
  { at: -0.6, hex: '#0ea5e9' },
  { at: -0.25, hex: '#14b8a6' },
  { at: 0, hex: '#22c55e' },
  { at: 0.25, hex: '#a3e635' },
  { at: 0.6, hex: '#facc15' },
  { at: 0.82, hex: '#f97316' },
  { at: 1, hex: '#dc2626' },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Colour for a curvature offset from the mean, normalised to -1..1 across the scale. */
function curvatureColor(t: number): string {
  const x = Math.min(1, Math.max(-1, t));
  let lo = RAMP[0];
  let hi = RAMP[RAMP.length - 1];
  for (let i = 0; i < RAMP.length - 1; i += 1) {
    if (x >= RAMP[i].at && x <= RAMP[i + 1].at) {
      lo = RAMP[i];
      hi = RAMP[i + 1];
      break;
    }
  }
  const span = hi.at - lo.at;
  const k = span === 0 ? 0 : (x - lo.at) / span;
  const a = hexToRgb(lo.hex);
  const b = hexToRgb(hi.hex);
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

/** Ophthalmic convention: 0° is horizontal-right, angles increase anti-clockwise. */
function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
}

function wedgePath(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r0, a0);
  const [x1, y1] = polar(r1, a0);
  const [x2, y2] = polar(r1, a1);
  const [x3, y3] = polar(r0, a1);
  return (
    `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} ` +
    `A${r1},${r1} 0 0,0 ${x2.toFixed(1)},${y2.toFixed(1)} ` +
    `L${x3.toFixed(1)},${y3.toFixed(1)} A${r0},${r0} 0 0,1 ${x0.toFixed(1)},${y0.toFixed(1)} Z`
  );
}

export function CornealTopography({
  deltaK,
  steepMeridian,
  meanK,
  showReadout = true,
  caption,
}: CornealTopographyProps) {
  // Over-correcting past zero doesn't flatten the cornea further — it tips the
  // astigmatism over onto the other meridian, so the bowtie swings 90°.
  const magnitude = Math.abs(deltaK);
  const steep = deltaK < 0 ? (steepMeridian + 90) % 180 : steepMeridian;
  const cells: { d: string; fill: string }[] = [];

  for (let ring = 0; ring < RINGS; ring += 1) {
    const t0 = INNER + ((1 - INNER) * ring) / RINGS;
    const t1 = INNER + ((1 - INNER) * (ring + 1)) / RINGS;
    const mid = (t0 + t1) / 2;
    // The astigmatic signature is weakest dead-centre and at the very edge —
    // that radial profile is what separates the bowtie's two lobes.
    const radialWeight = 0.68 + 0.32 * Math.sin(Math.PI * mid);

    for (let w = 0; w < WEDGES; w += 1) {
      const a0 = (360 * w) / WEDGES;
      const a1 = (360 * (w + 1)) / WEDGES;
      const theta = (a0 + a1) / 2;
      const offset =
        (magnitude / 2) * Math.cos((2 * (theta - steep) * Math.PI) / 180) * radialWeight;
      cells.push({ d: wedgePath(t0 * R, t1 * R, a0, a1), fill: curvatureColor(offset / SCALE_SPAN) });
    }
  }

  const flatMeridian = (steep + 90) % 180;
  const showMeridians = magnitude > 0.35;
  const [sx1, sy1] = polar(R + 12, steep);
  const [sx2, sy2] = polar(R + 12, steep + 180);
  const [fx1, fy1] = polar(R + 12, flatMeridian);
  const [fx2, fy2] = polar(R + 12, flatMeridian + 180);

  return (
    <div className="topo-diagram">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="topo-svg" role="img" aria-label="Corneal curvature map">
        <defs>
          <clipPath id="topo-clip">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
        </defs>

        <circle cx={CX} cy={CY} r={R + 9} className="topo-rim" />
        <g clipPath="url(#topo-clip)">
          {cells.map((cell, i) => (
            <path key={i} d={cell.d} fill={cell.fill} />
          ))}
        </g>
        <circle cx={CX} cy={CY} r={R} className="topo-edge" />

        {showMeridians && (
          <g className="topo-meridians">
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} className="topo-steep" />
            <line x1={fx1} y1={fy1} x2={fx2} y2={fy2} className="topo-flat" />
            <text x={sx1} y={sy1 - 6} className="topo-meridian-label" textAnchor="middle">
              STEEP {Math.round(steep)}°
            </text>
            <text x={fx1 + 6} y={fy1 + 4} className="topo-meridian-label">
              FLAT {Math.round(flatMeridian)}°
            </text>
          </g>
        )}
      </svg>

      <div className="topo-legend" aria-hidden="true">
        <span>FLATTER</span>
        <div className="topo-legend-bar" />
        <span>STEEPER</span>
      </div>
      {showReadout && (
        <p className="topo-readout">
          K{'₂'} − K{'₁'} = <strong>{magnitude.toFixed(2)} D</strong> · mean {meanK.toFixed(2)} D
        </p>
      )}
      {caption && <p className="ray-caption">{caption}</p>}
    </div>
  );
}
