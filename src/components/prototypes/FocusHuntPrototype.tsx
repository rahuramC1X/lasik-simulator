import { useMemo, useState } from 'react';

/**
 * PROTOTYPE — "Focus Hunt". The player drags a single focus slider; the
 * whole scene sharpens only near one hidden correct value (both too-far and
 * too-near stay blurry, like a real lens), and a hidden target only becomes
 * clickable once it's actually in focus. Five rounds, randomized each time.
 */

const ROUNDS = 5;
const FOUND_BLUR_PX = 2.4;

interface Round {
  targetFocus: number;
  tolerance: number;
  targetX: number;
  targetY: number;
  decoys: { x: number; y: number; r: number; hue: number }[];
}

function makeRound(index: number): Round {
  const tolerance = 30 - index * 4; // gets narrower each round
  return {
    targetFocus: 15 + Math.random() * 70,
    tolerance,
    targetX: 15 + Math.random() * 70,
    targetY: 15 + Math.random() * 70,
    decoys: Array.from({ length: 10 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: 4 + Math.random() * 10,
      hue: 90 + Math.random() * 60,
    })),
  };
}

export function FocusHuntPrototype({ onBack }: { onBack: () => void }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<Round>(() => makeRound(0));
  const [focusValue, setFocusValue] = useState(50);
  const [attempts, setAttempts] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const error = Math.abs(focusValue - round.targetFocus);
  const blurPx = Math.min(18, (error / round.tolerance) * 18);
  const inFocus = blurPx <= FOUND_BLUR_PX;

  const totalScore = useMemo(() => scores.reduce((a, b) => a + b, 0), [scores]);

  const nextRound = (points: number) => {
    setScores((s) => [...s, points]);
    if (roundIndex + 1 >= ROUNDS) {
      setDone(true);
      return;
    }
    const next = roundIndex + 1;
    setRoundIndex(next);
    setRound(makeRound(next));
    setFocusValue(50);
    setAttempts(0);
    setMessage(null);
  };

  const handleTargetClick = () => {
    if (!inFocus) {
      setAttempts((a) => a + 1);
      setMessage('Still too blurry — keep adjusting.');
      return;
    }
    const points = Math.max(20, Math.round(100 - attempts * 15 - blurPx * 3));
    setMessage(`Found it! +${points}`);
    setTimeout(() => nextRound(points), 550);
  };

  const restart = () => {
    setRoundIndex(0);
    setRound(makeRound(0));
    setFocusValue(50);
    setAttempts(0);
    setScores([]);
    setMessage(null);
    setDone(false);
  };

  return (
    <div className="screen proto-screen">
      <div className="proto-card">
        <div className="proto-header">
          <div>
            <p className="eyebrow">PROTOTYPE · FOCUS HUNT</p>
            <h1 className="proto-title">Round {Math.min(roundIndex + 1, ROUNDS)} / {ROUNDS}</h1>
          </div>
          <button type="button" className="icon-button" onClick={onBack}>
            EXIT
          </button>
        </div>

        {!done ? (
          <>
            <p className="proto-hint">
              Drag the slider until the scene sharpens, then click the star before it blurs again.
            </p>

            <div className="focus-scene" style={{ filter: `blur(${blurPx}px)` }}>
              {round.decoys.map((d, i) => (
                <span
                  key={i}
                  className="focus-decoy"
                  style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r * 2, height: d.r * 2, background: `hsl(${d.hue} 60% 45%)` }}
                />
              ))}
              <button
                type="button"
                className="focus-target"
                style={{ left: `${round.targetX}%`, top: `${round.targetY}%` }}
                onClick={handleTargetClick}
                aria-label="Hidden target"
              >
                ⭐
              </button>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={focusValue}
              onChange={(e) => setFocusValue(Number(e.target.value))}
              className="focus-slider"
              aria-label="Focus"
            />

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
