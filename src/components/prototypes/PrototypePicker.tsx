export type PrototypeId = 'focus-hunt' | 'vision-chase' | 'optical-puzzle' | 'decode-report';

interface PrototypeCardData {
  id: PrototypeId;
  icon: string;
  name: string;
  tagline: string;
}

const CARDS: readonly PrototypeCardData[] = [
  { id: 'focus-hunt', icon: '🔭', name: 'Focus Hunt', tagline: 'Find the one focus point where the scene sharpens — then click before it blurs again.' },
  { id: 'vision-chase', icon: '🏃', name: 'Vision Chase', tagline: "Keep a wandering hero inside your mouse-controlled spotlight." },
  { id: 'optical-puzzle', icon: '🧩', name: 'Optical Puzzle', tagline: 'Rotate and stretch a distorted shape back into place — by eye, no numbers.' },
  { id: 'decode-report', icon: '🔍', name: 'Decode Your Eye', tagline: 'A real-looking report, three lines you have to work out by manipulating the eye itself.' },
];

interface PrototypePickerProps {
  onSelect: (id: PrototypeId) => void;
  onBack: () => void;
}

/**
 * A comparison menu for the candidate core mechanics — not part of the
 * shipped curriculum. The first three are variations on the same
 * see-and-react loop; "Decode Your Eye" is a different bet entirely, so it's
 * here to be played against them rather than assumed better.
 */
export function PrototypePicker({ onSelect, onBack }: PrototypePickerProps) {
  return (
    <div className="screen proto-picker-screen">
      <div className="proto-picker-card">
        <div className="proto-header">
          <div>
            <p className="eyebrow">MECHANIC PROTOTYPES</p>
            <h1 className="proto-title">Which one feels right?</h1>
          </div>
          <button type="button" className="icon-button" onClick={onBack}>
            MAIN MENU
          </button>
        </div>
        <p className="proto-hint">
          Candidate cores for the "see → interpret → control → react" loop — plus one that swaps
          reacting for reading. Play each for a few rounds; whichever makes you want one more round wins.
        </p>

        <div className="proto-picker-grid">
          {CARDS.map((card) => (
            <button key={card.id} type="button" className="proto-picker-tile" onClick={() => onSelect(card.id)}>
              <span className="proto-picker-icon">{card.icon}</span>
              <span className="proto-picker-name">{card.name}</span>
              <span className="proto-picker-tagline">{card.tagline}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
