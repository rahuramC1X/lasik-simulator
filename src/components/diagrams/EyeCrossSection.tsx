import type { StructureId } from '../../game/curriculum';
import { arcPath, ellipsePoint } from './svgMath';

interface EyeCrossSectionProps {
  /** The structure currently being asked for; drawn with a pulsing highlight. */
  activeId: StructureId | null;
  /** Structures already found — drawn dimmed/checked instead of neutral. */
  foundIds: ReadonlySet<StructureId>;
  /** Most recent tap result, used to flash the shape that was actually clicked. */
  lastTap: { id: StructureId; correct: boolean } | null;
  onSelect: (id: StructureId) => void;
}

const CX = 410;
const CY = 210;

// Shared anchor angles for the "front opening" every back-of-eye layer
// (sclera/retina/vitreous) is drawn up to, so their front edges line up.
const OPEN_TOP = 230;
const OPEN_BOTTOM = 130;

const SCLERA_R = { rx: 205, ry: 175 };
const RETINA_R = { rx: 183, ry: 153 };
const VITREOUS_R = { rx: 172, ry: 142 };

const edgeTop = ellipsePoint(CX, CY, RETINA_R.rx, RETINA_R.ry, OPEN_TOP);
const edgeBottom = ellipsePoint(CX, CY, RETINA_R.rx, RETINA_R.ry, OPEN_BOTTOM);
const RETINA_ARC = arcPath(CX, CY, RETINA_R.rx, RETINA_R.ry, OPEN_TOP, OPEN_BOTTOM, 1);

const MACULA = ellipsePoint(CX, CY, RETINA_R.rx, RETINA_R.ry, 0);
const OPTIC_ROOT = ellipsePoint(CX, CY, SCLERA_R.rx, SCLERA_R.ry, 18);

export function EyeCrossSection({ activeId, foundIds, lastTap, onSelect }: EyeCrossSectionProps) {
  const stateClass = (id: StructureId): string => {
    if (lastTap && lastTap.id === id && !lastTap.correct) return 'cross-state-wrong';
    if (id === activeId) return 'cross-state-active';
    if (foundIds.has(id)) return 'cross-state-found';
    return 'cross-state-idle';
  };

  const shapeProps = (id: StructureId, extraClass: string) => ({
    className: `cross-shape ${extraClass} ${stateClass(id)}`,
    onClick: () => onSelect(id),
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': id,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onSelect(id);
    },
  });

  return (
    <svg viewBox="0 0 700 420" className="cross-section-svg" role="img" aria-label="Eye cross-section diagram">
      {/* Sclera — the outer wall. Passive: not quizzed, just context. */}
      <ellipse cx={CX} cy={CY} rx={SCLERA_R.rx} ry={SCLERA_R.ry} className="cross-sclera" />

      {/* Vitreous — fills the chamber behind the lens. */}
      <path
        d={`${arcPath(CX, CY, VITREOUS_R.rx, VITREOUS_R.ry, OPEN_TOP, OPEN_BOTTOM, 1)} L${edgeTop.x.toFixed(1)},${edgeTop.y.toFixed(1)} Z`}
        {...shapeProps('vitreous', 'cross-vitreous')}
      />

      {/* Retina — thin arc lining the back wall. Wide invisible stroke for a comfortable hit target. */}
      <path d={RETINA_ARC} className="cross-retina-hit" onClick={() => onSelect('retina')} aria-hidden="true" />
      <path d={RETINA_ARC} {...shapeProps('retina', 'cross-retina')} />

      {/* Optic nerve — exits through the back wall. */}
      <path
        d={`M${OPTIC_ROOT.x.toFixed(1)},${(OPTIC_ROOT.y - 16).toFixed(1)} L${(OPTIC_ROOT.x + 62).toFixed(1)},${(OPTIC_ROOT.y + 6).toFixed(1)} L${(OPTIC_ROOT.x + 62).toFixed(1)},${(OPTIC_ROOT.y + 34).toFixed(1)} L${OPTIC_ROOT.x.toFixed(1)},${(OPTIC_ROOT.y + 16).toFixed(1)} Z`}
        {...shapeProps('optic-nerve', 'cross-optic-nerve')}
      />

      {/* Macula — small dense spot on the retina, dead centre of the visual axis. */}
      <circle cx={MACULA.x} cy={MACULA.y} r={12} {...shapeProps('macula', 'cross-macula')} />

      {/* Lens — just behind the iris. */}
      <ellipse cx={365} cy={CY} rx={34} ry={78} {...shapeProps('lens', 'cross-lens')} />

      {/* Iris — two leaves either side of the pupil gap. */}
      <path d="M315,120 Q333,152 325,185 L313,185 Q302,152 313,120 Z" {...shapeProps('iris', 'cross-iris')} />
      <path d="M315,300 Q333,268 325,235 L313,235 Q302,268 313,300 Z" {...shapeProps('iris', 'cross-iris')} />

      {/* Pupil — the opening between the iris leaves. */}
      <rect x={305} y={185} width={26} height={50} rx={5} {...shapeProps('pupil', 'cross-pupil')} />

      {/* Cornea — the clear bulging front window. */}
      <path
        d={`M${edgeTop.x.toFixed(1)},${edgeTop.y.toFixed(1)} Q120,210 ${edgeBottom.x.toFixed(1)},${edgeBottom.y.toFixed(1)} Q230,210 ${edgeTop.x.toFixed(1)},${edgeTop.y.toFixed(1)} Z`}
        {...shapeProps('cornea', 'cross-cornea')}
      />

      {/* Light-path hint arrow — reinforces "this is the direction light travels." */}
      <g className="cross-light-arrow" aria-hidden="true">
        <line x1={20} y1={CY} x2={95} y2={CY} />
        <polygon points={`95,${CY - 6} 108,${CY} 95,${CY + 6}`} />
      </g>
    </svg>
  );
}
