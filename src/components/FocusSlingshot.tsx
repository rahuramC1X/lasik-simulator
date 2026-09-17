import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { CastleFocusScene } from './diagrams/CastleFocusScene';

interface FocusSlingshotProps {
  /** The value that brings the castle into focus, 0-100 — same scale as CastleFocusScene. */
  target: number;
  tolerance?: number;
  /** True once a shot has already been committed — no more aiming. */
  disabled: boolean;
  /** Called once the flight animation finishes, with the power the shot was released at. */
  onFire: (power: number) => void;
}

/** Must match CastleFocusScene's own viewBox so the two overlaid SVGs share one coordinate space. */
const VB_W = 640;
const VB_H = 260;

/** Where the sling's fork sits — right beside Dexter, like he's holding it up to aim. */
const ANCHOR = { x: 92, y: 150 };
const FORK_BASE = [
  { x: 86, y: 176 },
  { x: 98, y: 176 },
];
const FORK_TIPS = [
  { x: 74, y: 118 },
  { x: 112, y: 118 },
];
/** Roughly the castle's centre — where a fired shot visually lands. */
const IMPACT = { x: 468, y: 178 };

/** Pixel (svg-unit) pull distance that maps to 100 power — tuned to stay inside the frame. */
const MAX_PULL = 118;
/** Pulls shorter than this snap back with no shot fired — treated as a cancelled aim, not a 0. */
const MIN_PULL_TO_FIRE = 10;
/** How long the shot takes to reach the castle before the result actually lands — must match the CSS transition below. */
const FLIGHT_MS = 420;

/**
 * The interactive half of the 'focus' stage: a literal slingshot. Renders
 * CastleFocusScene underneath for the castle/Dexter/blur, and owns an
 * overlay SVG in the same coordinate space for the fork, elastic band, and
 * draggable pouch. Pulling back previews the resulting corneal power live
 * (through the same blur math CastleFocusScene always used); releasing
 * fires — the pouch snaps back, a shot flies to the castle, and only once
 * it visually lands does the parent get told what power it was released at.
 */
export function FocusSlingshot({ target, tolerance = 14, disabled, onFire }: FocusSlingshotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [handle, setHandle] = useState(ANCHOR);
  const [power, setPower] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [firing, setFiring] = useState(false);
  const [launched, setLaunched] = useState(false);

  // Two-frame delay so the browser paints the shot at ANCHOR before we move
  // it to IMPACT — otherwise the cx/cy transition below has no "from" state
  // to animate away from.
  useEffect(() => {
    if (!firing) return;
    const raf = requestAnimationFrame(() => setLaunched(true));
    return () => cancelAnimationFrame(raf);
  }, [firing]);

  const toScenePoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return ANCHOR;
    return {
      x: ((clientX - rect.left) / rect.width) * VB_W,
      y: ((clientY - rect.top) / rect.height) * VB_H,
    };
  };

  const applyPull = (point: { x: number; y: number }) => {
    const dx = point.x - ANCHOR.x;
    const dy = point.y - ANCHOR.y;
    const distance = Math.hypot(dx, dy);
    const clamp = distance > MAX_PULL ? MAX_PULL / distance : 1;
    setHandle({ x: ANCHOR.x + dx * clamp, y: ANCHOR.y + dy * clamp });
    setPower(Math.min(100, (Math.min(distance, MAX_PULL) / MAX_PULL) * 100));
  };

  const startDrag = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (disabled || firing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    applyPull(toScenePoint(e.clientX, e.clientY));
  };

  const moveDrag = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    applyPull(toScenePoint(e.clientX, e.clientY));
  };

  const release = () => {
    if (!dragging) return;
    setDragging(false);
    setHandle(ANCHOR); // the band always snaps back — whether or not a shot fires
    if (power < MIN_PULL_TO_FIRE) {
      setPower(0);
      return;
    }
    setFiring(true);
    const firedPower = power;
    window.setTimeout(() => onFire(firedPower), FLIGHT_MS);
  };

  const charge = Math.min(1, power / 100);
  const pouchColor = `hsl(${150 - charge * 130}, 80%, ${62 - charge * 8}%)`;
  const shotPos = launched ? IMPACT : ANCHOR;

  return (
    <div className="castle-scene-wrap">
      <CastleFocusScene power={power} target={target} tolerance={tolerance} />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="sling-overlay"
        aria-label="Slingshot — pull back and release to fire a focus shot at the castle"
        onPointerMove={moveDrag}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {dragging && <line x1={handle.x} y1={handle.y} x2={IMPACT.x} y2={IMPACT.y} className="sling-aim-line" />}

        {!firing && (
          <>
            <line x1={FORK_TIPS[0].x} y1={FORK_TIPS[0].y} x2={handle.x} y2={handle.y} className="sling-band" />
            <line x1={FORK_TIPS[1].x} y1={FORK_TIPS[1].y} x2={handle.x} y2={handle.y} className="sling-band" />
          </>
        )}
        <path
          d={`M${FORK_BASE[0].x},${FORK_BASE[0].y} L${FORK_TIPS[0].x},${FORK_TIPS[0].y} M${FORK_BASE[1].x},${FORK_BASE[1].y} L${FORK_TIPS[1].x},${FORK_TIPS[1].y}`}
          className="sling-fork"
        />

        {firing ? (
          <circle cx={shotPos.x} cy={shotPos.y} r={9} className="sling-shot" />
        ) : (
          <circle
            cx={handle.x}
            cy={handle.y}
            r={13 + charge * 4}
            fill={pouchColor}
            className={`sling-pouch${disabled ? ' sling-pouch-disabled' : ''}`}
            onPointerDown={startDrag}
          />
        )}
      </svg>
    </div>
  );
}
