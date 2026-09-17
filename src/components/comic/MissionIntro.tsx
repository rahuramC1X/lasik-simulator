import { CHARACTERS } from '../../game/characters';
import type { LevelStory } from '../../game/story';
import { ComicStrip } from './ComicStrip';

interface MissionIntroProps {
  levelCode: string;
  levelName: string;
  story: LevelStory;
  onStart: () => void;
  onBack: () => void;
}

/** The comic beat before a mission starts — the hero's problem, in their own words. */
export function MissionIntro({ levelCode, levelName, story, onStart, onBack }: MissionIntroProps) {
  const hero = CHARACTERS[story.character];

  return (
    <div className="screen mission-intro-screen">
      <div className="mission-intro-card">
        <p className="eyebrow">
          {levelCode} · {hero.name}'S MISSION
        </p>
        <h1 className="mission-intro-title">{levelName}</h1>

        <ComicStrip lines={story.intro} />

        <div className="intro-buttons">
          <button type="button" className="primary-button large" onClick={onStart}>
            START MISSION
          </button>
          <button type="button" className="ghost-button" onClick={onBack}>
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}
