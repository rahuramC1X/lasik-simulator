import type { ReactElement } from 'react';
import type { CharacterId } from '../../game/characters';

/**
 * Hand-drawn flat-mascot SVG portraits for the cast. Deliberately simple,
 * bold-outlined shapes — a comic-mascot style, not an illustration pipeline.
 * Each returns a self-contained <svg viewBox="0 0 200 200">.
 */

const INK = '#1a2e22';

export type OraMood = 'happy' | 'excited' | 'confused' | 'suspicious';

export function OraAvatar({ mood = 'happy' }: { mood?: OraMood } = {}): ReactElement {
  const irisColor = mood === 'excited' ? '#fde68a' : mood === 'confused' ? '#c084fc' : mood === 'suspicious' ? '#fca5a5' : '#5eead4';
  return (
    <svg viewBox="0 0 200 200" className="avatar-svg" role="img" aria-label="ORA">
      <ellipse cx="100" cy="178" rx="34" ry="6" fill="#000" opacity="0.15" />
      <path d="M70,140 Q60,150 68,158" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M130,140 Q140,150 132,158" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
      <circle cx="55" cy="88" r="9" fill="#bbf7d0" stroke={INK} strokeWidth="4" />
      <circle cx="145" cy="88" r="9" fill="#bbf7d0" stroke={INK} strokeWidth="4" />
      <line x1="63" y1="88" x2="78" y2="95" stroke={INK} strokeWidth="4" />
      <line x1="137" y1="88" x2="122" y2="95" stroke={INK} strokeWidth="4" />
      <circle cx="100" cy="105" r="58" fill="#f0fdf4" stroke={INK} strokeWidth="5" />
      <circle cx="100" cy="105" r="40" fill="#0f2f24" stroke={INK} strokeWidth="4" />
      <circle cx="100" cy="105" r="24" fill={irisColor} />
      <circle cx="100" cy="105" r="10" fill="#0f2f24" />
      <circle cx="92" cy="97" r="5" fill="#fff" />
      <circle cx="70" cy="135" r="4" fill="#5eead4" />
      <circle cx="130" cy="135" r="4" fill="#5eead4" />
      <circle cx="100" cy="140" r="4" fill="#5eead4" />
    </svg>
  );
}

export function DexterAvatar(): ReactElement {
  return (
    <svg viewBox="0 0 200 200" className="avatar-svg" role="img" aria-label="Dexter">
      <ellipse cx="100" cy="178" rx="42" ry="6" fill="#000" opacity="0.15" />
      <path d="M50,120 Q28,110 32,88 Q48,98 56,116 Z" fill="#16a34a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M150,120 Q172,110 168,88 Q152,98 144,116 Z" fill="#16a34a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="100" cy="138" rx="52" ry="42" fill="#4ade80" stroke={INK} strokeWidth="5" />
      <ellipse cx="100" cy="148" rx="26" ry="20" fill="#d9f99d" />
      <circle cx="100" cy="76" r="40" fill="#4ade80" stroke={INK} strokeWidth="5" />
      <path d="M78,44 L86,58 L70,58 Z" fill="#16a34a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M122,44 L130,58 L114,58 Z" fill="#16a34a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="83" cy="76" r="13" fill="#fff" stroke={INK} strokeWidth="3.5" />
      <circle cx="117" cy="76" r="13" fill="#fff" stroke={INK} strokeWidth="3.5" />
      <circle cx="86" cy="78" r="6" fill="#0f2f24" />
      <circle cx="114" cy="78" r="6" fill="#0f2f24" />
      <ellipse cx="100" cy="98" rx="16" ry="11" fill="#d9f99d" stroke={INK} strokeWidth="3.5" />
      <circle cx="94" cy="99" r="2.4" fill="#166534" />
      <circle cx="106" cy="99" r="2.4" fill="#166534" />
      <path d="M90,104 Q100,110 110,104" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function LunaAvatar(): ReactElement {
  return (
    <svg viewBox="0 0 200 200" className="avatar-svg" role="img" aria-label="Luna">
      <ellipse cx="100" cy="178" rx="38" ry="6" fill="#000" opacity="0.15" />
      <ellipse cx="82" cy="46" rx="10" ry="34" fill="#f5d0fe" stroke={INK} strokeWidth="4" transform="rotate(-12 82 46)" />
      <ellipse cx="118" cy="46" rx="10" ry="34" fill="#f5d0fe" stroke={INK} strokeWidth="4" transform="rotate(12 118 46)" />
      <ellipse cx="82" cy="48" rx="4.5" ry="24" fill="#fbcfe8" transform="rotate(-12 82 48)" />
      <ellipse cx="118" cy="48" rx="4.5" ry="24" fill="#fbcfe8" transform="rotate(12 118 48)" />
      <path
        d="M100,140 Q60,150 58,175 Q100,190 142,175 Q140,150 100,140 Z"
        fill="#c084fc"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="90" r="38" fill="#faf5ff" stroke={INK} strokeWidth="5" />
      <path d="M72,70 Q100,30 128,70 Q100,60 72,70 Z" fill="#a855f7" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="36" r="5" fill="#fde68a" stroke={INK} strokeWidth="2.5" />
      <circle cx="86" cy="92" r="6" fill="#0f172a" />
      <circle cx="114" cy="92" r="6" fill="#0f172a" />
      <circle cx="88" cy="90" r="2" fill="#fff" />
      <circle cx="116" cy="90" r="2" fill="#fff" />
      <path d="M92,106 Q100,111 108,106" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="66" y1="98" x2="52" y2="96" stroke={INK} strokeWidth="2" />
      <line x1="66" y1="103" x2="50" y2="104" stroke={INK} strokeWidth="2" />
      <line x1="134" y1="98" x2="148" y2="96" stroke={INK} strokeWidth="2" />
      <line x1="134" y1="103" x2="150" y2="104" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

export function CometAvatar(): ReactElement {
  return (
    <svg viewBox="0 0 200 200" className="avatar-svg" role="img" aria-label="Captain Comet">
      <ellipse cx="100" cy="178" rx="40" ry="6" fill="#000" opacity="0.15" />
      <path d="M60,110 Q30,140 46,172 Q60,150 76,140 Z" fill="#0ea5e9" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M140,110 Q170,140 154,172 Q140,150 124,140 Z" fill="#0ea5e9" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path
        d="M100,120 Q66,124 64,155 Q100,172 136,155 Q134,124 100,120 Z"
        fill="#38bdf8"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <polygon
        points="100,130 105,142 118,142 108,150 112,163 100,155 88,163 92,150 82,142 95,142"
        fill="#fde68a"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="80" r="46" fill="#e0f2fe" stroke={INK} strokeWidth="5" />
      <path d="M60,74 Q100,50 140,74 Q140,100 100,108 Q60,100 60,74 Z" fill="#0284c7" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="88" cy="80" r="6" fill="#f0f9ff" opacity="0.8" />
      <rect x="94" y="38" width="12" height="14" rx="4" fill="#0ea5e9" stroke={INK} strokeWidth="3" />
      <circle cx="100" cy="34" r="6" fill="#fde68a" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}

const AVATARS: Record<CharacterId, (props?: { mood?: OraMood }) => ReactElement> = {
  ora: OraAvatar,
  dexter: DexterAvatar,
  luna: LunaAvatar,
  comet: CometAvatar,
};

export function CharacterAvatar({ id, mood }: { id: CharacterId; mood?: OraMood }): ReactElement {
  const Avatar = AVATARS[id];
  return <Avatar mood={mood} />;
}
