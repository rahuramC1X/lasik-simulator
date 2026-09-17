/** Small inset diagram: the cornea's layers and where LASIK actually operates. */
export function CorneaLayers() {
  return (
    <div className="cornea-layers">
      <svg viewBox="0 0 460 170" className="cornea-layers-svg" role="img" aria-label="Corneal layers diagram">
        {/* Endothelium — innermost. */}
        <rect x={20} y={110} width={420} height={16} className="layer-endothelium" />
        {/* Stroma — thick middle layer, what the laser reshapes. */}
        <rect x={20} y={48} width={420} height={62} className="layer-stroma" />
        {/* Epithelium + Bowman's — the flap, shown lifted. */}
        <path d="M20,48 L20,30 L120,14 L360,14 L440,30 L440,48 Z" className="layer-flap" />

        <text x={230} y={82} textAnchor="middle" className="layer-label layer-label-stroma">
          STROMA — reshaped by the laser
        </text>
        <text x={230} y={125} textAnchor="middle" className="layer-label">
          ENDOTHELIUM
        </text>
        <text x={230} y={26} textAnchor="middle" className="layer-label layer-label-flap">
          FLAP (epithelium) — lifted, then replaced
        </text>
      </svg>
    </div>
  );
}
