import type { IdentifyFeedback, IdentifySnapshot } from '../game/GameEngine';
import type { StructureId } from '../game/curriculum';
import { IDENTIFY_SEQUENCE } from '../game/curriculum';
import { EyeCrossSection } from './diagrams/EyeCrossSection';

interface EyeIdentifyProps {
  identify: IdentifySnapshot;
  feedback: IdentifyFeedback | null;
  onSelect: (id: StructureId) => void;
  onContinue: () => void;
  onAbort: () => void;
}

const PROMPTS: Record<StructureId, string> = {
  cornea: "It's the clear dome bulging out at the very front — the first thing light passes through.",
  pupil: "The dark gap in the middle of the iris — not a structure itself, just an opening.",
  iris: 'The coloured ring either side of the pupil that controls how much light gets in.',
  lens: 'Just behind the iris — it fine-tunes focus for near and far objects.',
  vitreous: 'The large gel-filled chamber that takes up most of the eye.',
  retina: 'The thin layer lining the inside of the back wall.',
  macula: 'A small, dense spot on the retina, directly in line with the pupil.',
  'optic-nerve': "The bundle exiting the back of the eye — it's not part of the eyeball itself.",
};

/** EYE_INTRO — "meet the eye," using the anatomical cross-section, front-to-back. */
export function EyeIdentify({ identify, feedback, onSelect, onContinue, onAbort }: EyeIdentifyProps) {
  const found = new Set<StructureId>(IDENTIFY_SEQUENCE.slice(0, identify.index));
  const done = identify.current === null;
  const lastTap: { id: StructureId; correct: boolean } | null = feedback
    ? { id: feedback.structureId, correct: feedback.correct }
    : null;

  return (
    <div className="screen identify-screen">
      <div className="identify-card">
        <div className="identify-header">
          <div>
            <p className="eyebrow">MEET THE EYE</p>
            <h1 className="identify-title-main">
              {done ? 'You found every structure.' : `Find the ${identify.current!.replace('-', ' ').toUpperCase()}`}
            </h1>
          </div>
          <button type="button" className="icon-button" onClick={onAbort}>
            EXIT
          </button>
        </div>

        <p className="identify-hint">{done ? 'Light travels left to right through each of these in order.' : PROMPTS[identify.current!]}</p>

        <div className="cross-section-wrap">
          <EyeCrossSection activeId={identify.current} foundIds={found} lastTap={lastTap} onSelect={onSelect} />
        </div>

        <div className="identify-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(identify.index / identify.total) * 100}%` }} />
          </div>
          <span className="identify-count">
            {identify.index} / {identify.total}
          </span>
        </div>

        {feedback && !done && (
          <p key={feedback.id} className={`feedback ${feedback.correct ? 'feedback-good' : 'feedback-miss'}`}>
            {feedback.correct ? 'CORRECT' : 'NOT QUITE — TRY AGAIN'}
          </p>
        )}

        {done && (
          <button type="button" className="primary-button" onClick={onContinue}>
            CONTINUE
          </button>
        )}
      </div>
    </div>
  );
}
