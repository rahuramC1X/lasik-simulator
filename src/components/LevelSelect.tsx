import { CharacterAvatar } from './characters/Avatars';
import { CHARACTERS } from '../game/characters';
import { CHAPTERS, LEVELS } from '../game/levels';
import { getCompletedLevelIds, isLevelUnlocked } from '../game/progress';
import { getLevelStory } from '../game/story';

interface LevelSelectProps {
  onSelect: (id: number) => void;
  onBack: () => void;
}

/** The full 100-level map, presented as the Visionverse — heroes, not levels. */
export function LevelSelect({ onSelect, onBack }: LevelSelectProps) {
  const completed = getCompletedLevelIds();
  const foundationLevels = LEVELS.slice(0, 10);
  const unlockedMachines = foundationLevels.filter((l) => completed.has(l.id));

  return (
    <div className="screen levelselect-screen">
      <div className="levelselect-card">
        <div className="levelselect-header">
          <div>
            <p className="eyebrow">THE VISIONVERSE · 10 MISSIONS SO FAR</p>
            <h1 className="levelselect-title">{CHAPTERS[0].title}</h1>
          </div>
          <button type="button" className="icon-button" onClick={onBack}>
            MAIN MENU
          </button>
        </div>

        {unlockedMachines.length > 0 && (
          <div className="lab-strip">
            <span className="lab-strip-label">YOUR LAB</span>
            <div className="lab-strip-machines">
              {unlockedMachines.map((l) => (
                <span key={l.id} className="lab-machine" title={l.machine.name}>
                  {l.machine.icon} {l.machine.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="level-grid">
          {foundationLevels.map((level) => {
            const unlocked = isLevelUnlocked(level.id, completed);
            const done = completed.has(level.id);
            const hero = getLevelStory(level.id)?.character;
            return (
              <button
                key={level.id}
                type="button"
                className={`level-node${done ? ' level-node-done' : ''}${!unlocked ? ' level-node-locked' : ''}`}
                disabled={!unlocked}
                onClick={() => onSelect(level.id)}
              >
                {hero && unlocked && (
                  <span className="level-node-hero" style={{ borderColor: CHARACTERS[hero].color }}>
                    <CharacterAvatar id={hero} />
                  </span>
                )}
                <span className="level-node-code">{level.code} · {level.machine.name}</span>
                <span className="level-node-name">{level.name}</span>
                <span className="level-node-tagline">{level.tagline}</span>
                <span className="level-node-mark">{done ? '✓' : unlocked ? '' : '🔒'}</span>
              </button>
            );
          })}
        </div>

        <p className="levelselect-future-label">Future chapters</p>
        <div className="chapter-list">
          {CHAPTERS.slice(1).map((chapter) => (
            <div key={chapter.title} className="chapter-row">
              <span className="chapter-row-lock">🔒</span>
              <span className="chapter-row-title">{chapter.title}</span>
              <span className="chapter-row-range">
                Levels {chapter.range[0]}–{chapter.range[1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
