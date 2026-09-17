/**
 * The concrete payoff for the 'focus' stage: instead of only an abstract
 * ray-tracing diagram, show the actual thing the patient is failing to see —
 * framed the way a side-view action game frames a target (character on one
 * edge, objective on the other), because that's a much faster read than an
 * optics diagram for "what does this feel like."
 *
 * Purely decorative/illustrative — same defocus math as RayDiagram (power
 * vs. target, in the same 0-100 units) drives a real SVG Gaussian blur on
 * just the castle+mountain group, so the two diagrams always agree with
 * each other and with the slider.
 */

interface CastleFocusSceneProps {
  /** Current corneal-power slider value, 0-100 — same scale as RayDiagram. */
  power: number;
  /** The value that brings the castle into focus. Never rendered as text. */
  target: number;
  /** How close counts as "in focus," in the same units as power/target. */
  tolerance?: number;
  caption?: string;
}

/** Defocus, in power units, at which the blur reaches its visual maximum. */
const MAX_BLUR_AT = 46;
const MAX_BLUR_PX = 9;

export function CastleFocusScene({ power, target, tolerance = 14, caption }: CastleFocusSceneProps) {
  const defocus = Math.abs(power - target);
  const blur = Math.min(MAX_BLUR_PX, (defocus / MAX_BLUR_AT) * MAX_BLUR_PX);
  const aligned = defocus <= tolerance;

  return (
    <div className="castle-scene">
      <svg viewBox="0 0 640 260" className="castle-svg" role="img" aria-label="Dexter looking toward a distant castle">
        <defs>
          <linearGradient id="castle-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1f3a" />
            <stop offset="55%" stopColor="#3a2a52" />
            <stop offset="100%" stopColor="#f4a25e" />
          </linearGradient>
          <filter id="castle-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
          <radialGradient id="castle-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="640" height="260" fill="url(#castle-sky)" />
        <path d="M0,225 Q320,195 640,222 L640,260 L0,260 Z" className="castle-ground" />

        {/* The wrong target — the mountain Dexter's been mistakenly breathing fire at. */}
        <path
          d="M330,225 L392,118 L432,168 L470,132 L540,225 Z"
          className="castle-mountain"
          filter="url(#castle-blur)"
        />

        {/* The castle — the actual objective, positioned toward the far edge. */}
        <g filter="url(#castle-blur)">
          {aligned && <circle cx="470" cy="150" r="88" fill="url(#castle-glow)" />}
          <g className="castle-walls">
            <rect x="392" y="168" width="156" height="58" />
            <rect x="380" y="140" width="34" height="86" />
            <rect x="518" y="140" width="34" height="86" />
            <rect x="452" y="120" width="30" height="106" />
            <path d="M380,140 L397,116 L414,140 Z" />
            <path d="M518,140 L535,116 L552,140 Z" />
            <path d="M452,120 L467,98 L482,120 Z" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={396 + i * 32} y="160" width="14" height="10" />
            ))}
          </g>
          <rect x="422" y="196" width="26" height="30" rx="13" className="castle-door" />
          <rect x="460" y="150" width="14" height="14" className="castle-window" />
          <line x1="467" y1="98" x2="467" y2="80" className="castle-flagpole" />
          <path d="M467,80 L491,88 L467,96 Z" className="castle-flag" />
        </g>

        {/* Dexter, peering in from the edge of frame at whatever he's looking at. */}
        <g className="castle-dexter">
          <path d="M-10,178 Q28,150 62,178 Q66,214 30,224 Q-14,216 -10,178 Z" />
          <circle cx="30" cy="176" r="15" className="castle-dexter-eye" />
          <circle cx="34" cy="178" r="6" className="castle-dexter-pupil" />
          <path d="M-6,150 L4,132 L16,152 Z" className="castle-dexter-horn" />
        </g>
      </svg>
      {caption && <p className="ray-caption">{caption}</p>}
    </div>
  );
}
