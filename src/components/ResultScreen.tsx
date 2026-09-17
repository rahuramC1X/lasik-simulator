import { useEffect, useState } from 'react';
import { ComicStrip } from './comic/ComicStrip';
import { conceptById } from '../game/curriculum';
import type { HudSnapshot } from '../game/GameEngine';
import { formatDioptres } from '../game/Patient';
import { getLevel } from '../game/levels';
import type { LevelStory } from '../game/story';

interface ResultScreenProps {
  hud: HudSnapshot;
  outroStory: LevelStory | undefined;
  onReplay: () => void;
  onNextLevel: (() => void) | null;
  onStartTraining: (() => void) | null;
  onLevelSelect: () => void;
  onOpenCabinet: () => void;
}

/** Counts a number up to `target` over `duration` ms with an ease-out curve. */
function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

/** What this run's CASE line should read, given what the level actually covered. */
function caseLabel(hud: HudSnapshot): string {
  const stages = hud.level?.stages ?? [];
  const { patient } = hud;
  if (stages.includes('orient')) {
    return `Myopia ${formatDioptres(patient.myopia)} + Astigmatism ${formatDioptres(patient.astigmatism)}`;
  }
  if (stages.includes('precision')) return `Myopia ${formatDioptres(patient.myopia)}`;
  return hud.level?.tagline ?? '';
}

function checklistFor(hud: HudSnapshot): string[] {
  const stages = hud.level?.stages ?? [];
  const items: string[] = [];
  if (stages.some((s) => s === 'identify' || s === 'focus' || s === 'orient' || s === 'plan')) {
    items.push('Case understood');
  }
  if (stages.includes('precision')) {
    items.push('Treatment aligned', 'Precision maintained');
  }
  return items;
}

export function ResultScreen({
  hud,
  outroStory,
  onReplay,
  onNextLevel,
  onStartTraining,
  onLevelSelect,
  onOpenCabinet,
}: ResultScreenProps) {
  const { achievement, level } = hud;
  const animated = useCountUp(achievement?.overall ?? 0);

  if (!achievement || !level) return null;

  const newKnowledge = hud.unlockedThisRun.map((id) => conceptById(id)).filter((c) => c !== undefined);
  const nextLevel = level.id > 0 ? getLevel(level.id + 1) : undefined;
  const isTrainingRun = level.id === 0;

  return (
    <div className="screen result-screen">
      <div className="result-card">
        <div className="result-check">✓</div>
        <p className="result-eyebrow">{isTrainingRun ? 'DRILL COMPLETE' : `${level.code} COMPLETE`}</p>
        <h1 className="result-title">{level.name}</h1>

        {outroStory && <ComicStrip lines={outroStory.outro} />}

        <p className="result-patient">
          Case file #{hud.patient.id} · {hud.patient.name}
        </p>

        <div className="result-section">
          <h3 className="result-section-label">Case</h3>
          <p className="result-case">{caseLabel(hud)}</p>
          <ul className="result-checklist">
            {checklistFor(hud).map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>

        {newKnowledge.length > 0 && (
          <div className="result-section">
            <h3 className="result-section-label">New Knowledge</h3>
            <ul className="result-tag-list result-tag-knowledge">
              {newKnowledge.map((c) => (
                <li key={c!.id}>🧠 {c!.title}</li>
              ))}
            </ul>
            <h3 className="result-section-label result-section-label-spaced">New Skill</h3>
            <ul className="result-tag-list result-tag-skill">
              {newKnowledge.map((c) => (
                <li key={c!.id}>🎯 {c!.skill}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="result-section result-achievement">
          <h3 className="result-section-label">Achievement</h3>
          <p className="result-rank">🏆 {achievement.rank}</p>
          <div className="final-score">
            <span className="final-label">OVERALL</span>
            <span className="final-value">{Math.round(animated)}</span>
            <span className="final-rank">
              {achievement.nextRank ? `NEXT RANK · ${achievement.nextRank}` : 'TOP RANK REACHED'}
            </span>
          </div>
        </div>

        {nextLevel?.playable && (
          <div className="result-section">
            <h3 className="result-section-label">Next Challenge</h3>
            <p className="result-next">
              {nextLevel.machine.icon} {nextLevel.machine.name}
              <span className="result-next-sub">
                {nextLevel.code} · {nextLevel.name}
              </span>
            </p>
          </div>
        )}

        {onStartTraining && (
          <div className="result-training-callout">
            <p className="result-training-title">⚡ Precision Training recommended</p>
            <p className="result-training-body">
              Recent procedures have been rough. A short, low-pressure drill can help before the next case.
            </p>
            <button type="button" className="ghost-button" onClick={onStartTraining}>
              START DRILL
            </button>
          </div>
        )}

        <div className="result-buttons">
          {onNextLevel && (
            <button type="button" className="primary-button" onClick={onNextLevel}>
              NEXT LEVEL
            </button>
          )}
          <button type="button" className={onNextLevel ? 'ghost-button' : 'primary-button'} onClick={onReplay}>
            REPLAY
          </button>
          <button type="button" className="ghost-button" onClick={onLevelSelect}>
            LEVEL SELECT
          </button>
          <button type="button" className="ghost-button" onClick={onOpenCabinet}>
            KNOWLEDGE CABINET
          </button>
        </div>

        <p className="disclaimer">
          Virtual result. This is a fictional game experience inspired by LASIK — not medical or
          surgical training.
        </p>
      </div>
    </div>
  );
}
