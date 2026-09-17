import { useState } from 'react';
import type { GameEngine } from '../game/GameEngine';
import type { Patient } from '../game/Patient';
import { formatDioptres } from '../game/Patient';
import { AstigmatismDiagram } from './diagrams/AstigmatismDiagram';

interface AstigmatismChallengeProps {
  engine: GameEngine;
  patient: Patient;
  orientAccuracy: number | null;
  onContinue: () => void;
  onAbort: () => void;
}

/**
 * The 'orient' stage — astigmatism isn't corrected by power alone, it needs
 * an axis. The player rotates a dial until the stretched blur ellipse rounds
 * into a sharp point, judged visually rather than by a printed angle.
 */
export function AstigmatismChallenge({
  engine,
  patient,
  orientAccuracy,
  onContinue,
  onAbort,
}: AstigmatismChallengeProps) {
  const [axis, setAxis] = useState(90);
  const submitted = orientAccuracy !== null;
  const target = engine.getOrientTarget();

  return (
    <div className="screen focus-screen">
      <div className="focus-card">
        <p className="eyebrow">ASTIGMATISM: FIND THE AXIS</p>
        <h1 className="focus-title">Rotate {patient.name}'s correction into line</h1>
        <p className="focus-sub">
          Astigmatism {formatDioptres(patient.astigmatism)} means light focuses along two lines
          instead of one point — the blur is stretched, not just soft. Rotate the axis until it
          rounds into a sharp point.
        </p>

        <AstigmatismDiagram axis={axis} target={target} />

        <input
          type="range"
          min={0}
          max={180}
          value={axis}
          disabled={submitted}
          onChange={(e) => setAxis(Number(e.target.value))}
          className="focus-slider"
          aria-label="Correction axis, in degrees"
        />
        <div className="focus-slider-labels">
          <span>0°</span>
          <span>180°</span>
        </div>

        {!submitted ? (
          <button type="button" className="primary-button" onClick={() => engine.submitOrientation(axis)}>
            LOCK IN AXIS
          </button>
        ) : (
          <div className="focus-result">
            <p className="focus-result-score">{Math.round(orientAccuracy)}% on axis</p>
            <p className="intro-brief-fact">
              <strong>What you just learned:</strong> astigmatism blurs light along an axis, not
              just by an amount. A correction that ignores the axis can't fully sharpen the image —
              which is exactly why the next stage's tolerance depends on how well you did here.
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
