import { useEffect, useRef, useState } from 'react';
import type { CharacterId } from '../../game/characters';
import { CharacterAvatar } from '../characters/Avatars';

/**
 * PROTOTYPE — "Vision Chase". A hero wanders around the arena; only what's
 * inside a mouse-controlled spotlight is in sharp focus. Score is how much
 * of the run you kept them lit. Escalates: wander speed and radius drift
 * over the round.
 */

const DURATION = 20;
const SPOTLIGHT_RADIUS = 78;
const HEROES: CharacterId[] = ['dexter', 'luna', 'comet'];
const AVATAR_SIZE = 48;

export function VisionChasePrototype({ onBack }: { onBack: () => void }) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 350, y: 200 });
  const [seed, setSeed] = useState(() => Math.random() * 1000);
  // Derived from `seed` (already random) rather than a fresh Math.random()
  // call, so picking the hero stays a pure function of state during render.
  const hero = HEROES[Math.floor(seed * 7) % HEROES.length];
  const [charPos, setCharPos] = useState({ x: 350, y: 200 });
  const [spotPos, setSpotPos] = useState({ x: 350, y: 200 });
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let start: number | null = null;
    let last: number | null = null;
    let focusTime = 0;

    const loop = (now: number) => {
      if (start === null) start = now;
      if (last === null) last = now;
      const dt = (now - last) / 1000;
      last = now;
      const t = (now - start) / 1000;

      if (t >= DURATION) {
        setResult(Math.round((focusTime / DURATION) * 100));
        setRunning(false);
        return;
      }

      const speed = 0.32 + t * 0.012;
      const ampX = 230;
      const ampY = 120;
      const cx = 350 + Math.sin(t * speed + seed) * ampX;
      const cy = 200 + Math.cos(t * speed * 0.82 + seed * 1.3) * ampY;
      setCharPos({ x: cx, y: cy });
      setSpotPos({ ...mouseRef.current });

      const dist = Math.hypot(cx - mouseRef.current.x, cy - mouseRef.current.y);
      if (dist <= SPOTLIGHT_RADIUS) focusTime += dt;

      setElapsed(t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, seed]);

  const handleMove = (e: React.MouseEvent) => {
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const restart = () => {
    setElapsed(0);
    setResult(null);
    setRunning(true);
    setSeed(Math.random() * 1000);
  };

  return (
    <div className="screen proto-screen">
      <div className="proto-card proto-card-wide">
        <div className="proto-header">
          <div>
            <p className="eyebrow">PROTOTYPE · VISION CHASE</p>
            <h1 className="proto-title">Keep them in the light</h1>
          </div>
          <button type="button" className="icon-button" onClick={onBack}>
            EXIT
          </button>
        </div>

        {result === null ? (
          <>
            <p className="proto-hint">Move your mouse to track them. {Math.max(0, Math.ceil(DURATION - elapsed))}s left.</p>
            <div ref={arenaRef} className="chase-arena" onMouseMove={handleMove}>
              <div className="chase-dim-layer" />
              <div
                className="chase-clear-layer"
                style={{ clipPath: `circle(${SPOTLIGHT_RADIUS}px at ${spotPos.x}px ${spotPos.y}px)` }}
              />
              <div
                className="chase-hero"
                style={{ left: charPos.x - AVATAR_SIZE / 2, top: charPos.y - AVATAR_SIZE / 2, width: AVATAR_SIZE, height: AVATAR_SIZE }}
              >
                <CharacterAvatar id={hero} />
              </div>
              <div
                className="chase-spotlight-ring"
                style={{ left: spotPos.x - SPOTLIGHT_RADIUS, top: spotPos.y - SPOTLIGHT_RADIUS, width: SPOTLIGHT_RADIUS * 2, height: SPOTLIGHT_RADIUS * 2 }}
              />
            </div>
            <div className="proto-timer-track">
              <div className="proto-timer-fill" style={{ width: `${(elapsed / DURATION) * 100}%` }} />
            </div>
          </>
        ) : (
          <div className="proto-done">
            <p className="proto-done-score">{result}%</p>
            <p className="proto-hint">of the run kept in focus</p>
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
