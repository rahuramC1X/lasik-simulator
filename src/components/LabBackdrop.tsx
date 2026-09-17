/**
 * A quiet, decorative "living lab" scene behind the Main Menu — plants,
 * hanging lights, a floating scanner arm, glowing specimen tubes. Same flat
 * hand-drawn SVG language as the character avatars, kept low-opacity so it
 * never competes with foreground text.
 */
export function LabBackdrop() {
  return (
    <svg viewBox="0 0 800 500" className="lab-backdrop" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Potted plants, bottom corners. */}
      <g opacity="0.5">
        <path d="M40,500 L40,440 Q10,430 8,400 Q35,410 44,430 Q46,400 70,388 Q68,415 52,430 Q60,436 58,460 L54,500 Z" fill="#22c55e" />
        <path d="M44,500 L46,455 Q56,440 74,436 Q64,452 54,462 Q62,468 60,500 Z" fill="#16a34a" />
        <rect x="24" y="470" width="48" height="30" rx="6" fill="#166534" />
      </g>
      <g opacity="0.4" transform="translate(700,0) scale(-1,1) translate(-800,0)">
        <path d="M40,500 L40,440 Q10,430 8,400 Q35,410 44,430 Q46,400 70,388 Q68,415 52,430 Q60,436 58,460 L54,500 Z" fill="#22c55e" />
        <rect x="24" y="470" width="48" height="30" rx="6" fill="#166534" />
      </g>

      {/* Specimen tubes, glowing. */}
      {[110, 690].map((x, i) => (
        <g key={i} opacity="0.35">
          <rect x={x - 16} y="280" width="32" height="150" rx="14" fill="none" stroke="#5eead4" strokeWidth="2" />
          <rect x={x - 12} y="330" width="24" height="94" rx="10" fill="#34d399" opacity="0.5" />
          <circle cx={x} cy="360" r="4" fill="#bbf7d0" />
          <circle cx={x - 5} cy="390" r="3" fill="#bbf7d0" />
        </g>
      ))}

      {/* Hanging pendant lights. */}
      {[200, 400, 600].map((x, i) => (
        <g key={i} opacity="0.3">
          <line x1={x} y1="0" x2={x} y2="70" stroke="#5eead4" strokeWidth="2" />
          <path d={`M${x - 22},70 Q${x},100 ${x + 22},70 Z`} fill="#1a2e22" stroke="#5eead4" strokeWidth="2" />
          <circle cx={x} cy="88" r="6" fill="#bbf7d0" />
        </g>
      ))}

      {/* A small floating scanner drone. */}
      <g opacity="0.4" transform="translate(600,140)">
        <ellipse cx="0" cy="34" rx="26" ry="5" fill="#000" opacity="0.2" />
        <circle cx="0" cy="0" r="22" fill="none" stroke="#5eead4" strokeWidth="3" />
        <circle cx="0" cy="0" r="9" fill="#34d399" />
        <line x1="-30" y1="0" x2="-22" y2="0" stroke="#5eead4" strokeWidth="3" />
        <line x1="22" y1="0" x2="30" y2="0" stroke="#5eead4" strokeWidth="3" />
        <circle cx="-32" cy="0" r="4" fill="#bbf7d0" />
        <circle cx="32" cy="0" r="4" fill="#bbf7d0" />
      </g>

      {/* Vine along the top edge. */}
      <path
        d="M0,20 Q100,50 180,15 Q260,-10 340,25 Q420,55 500,18 Q580,-8 660,22 Q730,48 800,20"
        fill="none"
        stroke="#16a34a"
        strokeWidth="3"
        opacity="0.3"
      />
    </svg>
  );
}
