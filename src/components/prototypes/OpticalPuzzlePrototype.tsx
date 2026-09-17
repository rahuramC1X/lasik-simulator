import { useState } from 'react';

/**
 * PROTOTYPE — "Optical Puzzle". A shape has been rotated and stretched.
 * Two controls, no numeric readout — the player has to visually match it
 * back to the small reference shape. Locks in with a glow when close.
 */

const ROUNDS = 5;
const ROTATE_TOLERANCE = 4;
const SCALE_TOLERANCE = 0.05;

interface Round {
  appliedRotation: number;
  appliedScaleY: number;
}

function makeRound(): Round {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return {
    appliedRotation: sign * (12 + Math.random() * 30),
    appliedScaleY: 1 + (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.25),
  };
}

function Star({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style}>
      <polygon
        points="50,4 61,37 96,37 68,58 79,92 50,71 21,92 32,58 4,37 39,37"
        fill="#fde68a"
        stroke="#1a2e22"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OpticalPuzzlePrototype({ onBack }: { onBack: () => void }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<Round>(() => makeRound());
  const [sliderRotation, setSliderRotation] = useState(0);
  const [sliderScale, setSliderScale] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const netRotation = round.appliedRotation + sliderRotation;
  const netScaleY = round.appliedScaleY * sliderScale;
  const locked = Math.abs(netRotation) < ROTATE_TOLERANCE && Math.abs(netScaleY - 1) < SCALE_TOLERANCE;
  const totalScore = scores.reduce((a, b) => a + b, 0);

  const confirm = () => {
    if (!locked) {
      setMessage('Not quite — keep adjusting.');
      return;
    }
    const points = Math.max(30, Math.round(100 - Math.abs(netRotation) * 4 - Math.abs(netScaleY - 1) * 100));
    setMessage(`Locked! +${points}`);
    setTimeout(() => {
      setScores((s) => [...s, points]);
      if (roundIndex + 1 >= ROUNDS) {
        setDone(true);
        return;
      }
      setRoundIndex((r) => r + 1);
      setRound(makeRound());
      setSliderRotation(0);
      setSliderScale(1);
      setMessage(null);
    }, 550);
  };

  const restart = () => {
    setRoundIndex(0);
    setRound(makeRound());
    setSliderRotation(0);
    setSliderScale(1);
    setScores([]);
    setDone(false);
    setMessage(null);
  };

  return (
    <div className="screen proto-screen">
      <div className="proto-card">
        <div className="proto-header">
          <div>
            <p className="eyebrow">PROTOTYPE · OPTICAL PUZZLE</p>
            <h1 className="proto-title">Round {Math.min(roundIndex + 1, ROUNDS)} / {ROUNDS}</h1>
          </div>
          <button type="button" className="icon-button" onClick={onBack}>
            EXIT
          </button>
        </div>

        {!done ? (
          <>
            <p className="proto-hint">Match the reference — no numbers, just your eyes.</p>

            <div className="puzzle-stage">
              <div className="puzzle-reference">
                <Star className="puzzle-reference-svg" />
                <span className="puzzle-reference-label">REFERENCE</span>
              </div>
              <div className="puzzle-working">
                <Star
                  className={`puzzle-working-svg${locked ? ' puzzle-locked' : ''}`}
                  style={{ transform: `rotate(${netRotation}deg) scaleY(${netScaleY})` }}
                />
              </div>
            </div>

            <div className="puzzle-controls">
              <label className="puzzle-control">
                <span>ROTATE</span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={sliderRotation}
                  onChange={(e) => setSliderRotation(Number(e.target.value))}
                />
              </label>
              <label className="puzzle-control">
                <span>STRETCH</span>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.01}
                  value={sliderScale}
                  onChange={(e) => setSliderScale(Number(e.target.value))}
                />
              </label>
            </div>

            <button type="button" className={locked ? 'primary-button' : 'ghost-button'} onClick={confirm}>
              CONFIRM
            </button>

            {message && <p className="proto-feedback">{message}</p>}
            <p className="proto-score">Score so far: {totalScore}</p>
          </>
        ) : (
          <div className="proto-done">
            <p className="proto-done-score">{totalScore}</p>
            <p className="proto-hint">points across {ROUNDS} rounds</p>
            <div className="intro-buttons">
              <button type="button" className="primary-button" onClick={restart}>
                PLAY AGAIN
              </button>
              <button type="button" className="ghost-button" onClick={onBack}>
                BACK TO PROTOTYPES
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
