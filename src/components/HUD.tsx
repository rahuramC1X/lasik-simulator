import { OraAvatar } from './characters/Avatars';
import type { OraMood } from './characters/Avatars';
import type { HudSnapshot } from '../game/GameEngine';
import type { ShotGrade } from '../game/types';

interface HUDProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onAbort: () => void;
}

const ORA_MOOD_FOR_GRADE: Record<ShotGrade, OraMood> = {
  EXCELLENT: 'excited',
  GOOD: 'happy',
  ACCEPTABLE: 'confused',
  MISS: 'suspicious',
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${tone ? ` ${tone}` : ''}`}>{value}</span>
    </div>
  );
}

/** Minimal overlay: level, patient, three numbers, progress, live feedback. */
export function HUD({ hud, muted, onToggleMute, onAbort }: HUDProps) {
  const pct = (hud.progress / hud.total) * 100;
  const safetyTone = hud.safety >= 90 ? '' : hud.safety >= 70 ? 'warn' : 'bad';
  const remaining = hud.timeLimit !== null ? Math.max(0, hud.timeLimit - hud.elapsedSeconds) : null;
  const timeTone = remaining !== null && remaining <= 8 ? 'bad' : '';

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-block">
          <h2 className="hud-level">
            {hud.level?.machine.icon} {hud.level?.machine.name}
            <span className="hud-level-sub">
              {hud.level?.code} · {hud.precisionName}
            </span>
          </h2>
          <p className="hud-patient">
            Patient #{hud.patient.id} · {hud.patient.name}
          </p>
        </div>

        <div className="hud-stats">
          <Stat label="Precision" value={`${hud.precision}%`} />
          <Stat label="Safety" value={`${hud.safety}%`} tone={safetyTone} />
          <Stat label="Progress" value={`${hud.progress}/${hud.total}`} />
          {remaining !== null && <Stat label="Time" value={`${remaining}s`} tone={timeTone} />}
        </div>

        <div className="hud-actions">
          <button type="button" className="icon-button" onClick={onToggleMute}>
            {muted ? 'SOUND OFF' : 'SOUND ON'}
          </button>
          <button type="button" className="icon-button" onClick={onAbort}>
            EXIT
          </button>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="progress-track" role="presentation">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="hud-ora-row">
          <span className="hud-ora">
            <OraAvatar mood={hud.feedback ? ORA_MOOD_FOR_GRADE[hud.feedback.grade] : 'happy'} />
          </span>
          {hud.feedback ? (
            <p
              key={hud.feedback.id}
              className={`feedback feedback-${hud.feedback.grade.toLowerCase()}`}
            >
              {hud.feedback.text}
            </p>
          ) : (
            <p className="feedback feedback-hint">
              Track the target · click when the ring locks
            </p>
          )}
        </div>

        <p className="hud-timer">{hud.elapsedSeconds}s</p>
      </div>
    </div>
  );
}
