import { useState } from 'react';
import type { GameEngine } from '../game/GameEngine';
import type { Patient } from '../game/Patient';
import { formatDioptres } from '../game/Patient';
import { CastleFocusScene } from './diagrams/CastleFocusScene';
import { RayDiagram } from './diagrams/RayDiagram';
import { FocusSlingshot } from './FocusSlingshot';

interface FocusChallengeProps {
  engine: GameEngine;
  patient: Patient;
  focusAccuracy: number | null;
  onContinue: () => void;
  onAbort: () => void;
}

/**
 * FOCUS_INTRO — "why is vision blurry?" Dexter can't make out the castle
 * he's supposed to be looking at (see story.ts). The player pulls back a
 * slingshot — further pull, more corrective power — and releases to fire a
 * focus shot at it: an aim-and-release action, not a drag-a-value one,
 * matching the aim-and-fire core the precision stage already uses at
 * levels 4+. `FocusSlingshot` reports the power it committed at once the
 * shot visually lands; that's the same number `engine.submitFocus` always
 * took from the slider it replaced. Locking in then reveals the actual
 * optics — a real ray-tracing diagram showing light converging in front of
 * the retina — as the payoff, not the up-front ask.
 */
export function FocusChallenge({ engine, patient, focusAccuracy, onContinue, onAbort }: FocusChallengeProps) {
  const [firedPower, setFiredPower] = useState<number | null>(null);
  const submitted = focusAccuracy !== null;
  const target = engine.getFocusTarget();

  return (
    <div className="screen focus-screen">
      <div className="focus-card focus-card-wide">
        <p className="eyebrow">WHY IS VISION BLURRY?</p>
        <h1 className="focus-title">Bring the castle into focus for {patient.name}</h1>
        <p className="focus-sub">
          Myopia {formatDioptres(patient.myopia)} means the cornea and lens bend light too strongly —
          the world converges to a point <em>before</em> the retina. Pull back and release to fire a
          focus shot at the castle — the further you draw, the more corrective power it carries.
        </p>

        {!submitted ? (
          <FocusSlingshot
            target={target}
            disabled={false}
            onFire={(power) => {
              setFiredPower(power);
              engine.submitFocus(power);
            }}
          />
        ) : (
          <CastleFocusScene power={firedPower ?? target} target={target} />
        )}

        {submitted && (
          <div className="focus-result">
            <p className="focus-result-score">{Math.round(focusAccuracy)}% on target</p>

            <RayDiagram
              power={firedPower ?? target}
              target={target}
              caption="What was actually happening — light converging in front of the retina."
            />

            <p className="intro-brief-fact">
              <strong>What you just learned:</strong> in myopia, light focuses short of the retina —
              that's why distant objects blur. LASIK flattens the cornea just enough to push that
              focus point back onto the retina.
            </p>
            <div className="intro-buttons">
              <button type="button" className="primary-button" onClick={onContinue}>
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {!submitted && (
          <button type="button" className="ghost-button focus-exit" onClick={onAbort}>
            EXIT
          </button>
        )}
      </div>
    </div>
  );
}
