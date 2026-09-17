import type { CSSProperties } from 'react';
import { CHARACTERS } from '../../game/characters';
import type { ComicLine } from '../../game/story';
import { CharacterAvatar } from '../characters/Avatars';

interface ComicStripProps {
  lines: readonly ComicLine[];
}

/** A short sequence of speech-bubble panels — the story beat around a mission. */
export function ComicStrip({ lines }: ComicStripProps) {
  return (
    <div className="comic-strip">
      {lines.map((line, i) => {
        const character = CHARACTERS[line.characterId];
        const flip = i % 2 === 1;
        return (
          <div key={i} className={`comic-panel${flip ? ' comic-panel-flip' : ''}`} style={{ animationDelay: `${i * 0.22}s` }}>
            <div className="comic-avatar" style={{ borderColor: character.color }}>
              <CharacterAvatar id={line.characterId} mood={line.mood} />
            </div>
            <div className="comic-bubble" style={{ '--bubble-color': character.color } as CSSProperties}>
              <span className="comic-speaker" style={{ color: character.color }}>
                {character.name}
              </span>
              <p className="comic-text">{line.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
