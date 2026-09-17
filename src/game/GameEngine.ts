/**
 * Central game state machine.
 *
 * Framework-independent on purpose: it holds all mutable gameplay state, is
 * advanced by `update(dtMs)` from a render loop, and pushes a small HUD
 * snapshot to subscribers only when something a human would notice changes.
 * No React, no DOM, no canvas, no Three.js.
 *
 * The engine doesn't know what "Level 4" is — it just walks whatever stage
 * sequence the selected LevelDefinition (src/game/levels.ts) describes. That
 * is what lets the level roster scale to a hundred entries without the
 * engine growing a hundred special cases.
 */

import {
  needsPrecisionTraining as computeNeedsPrecisionTraining,
  recordPrecisionAttempt,
  resetPrecisionHistory,
} from './adaptive';
import { play } from './audio';
import type { StructureId } from './curriculum';
import { IDENTIFY_SEQUENCE, unlockConcepts } from './curriculum';
import { EffectSystem } from './effects';
import { LaserController } from './Laser';
import type { LaserState } from './Laser';
import type { LevelDefinition, StageType } from './levels';
import { PRECISION_TRAINING_LEVEL, getLevel } from './levels';
import type { Patient } from './Patient';
import { pickPatient } from './Patient';
import { getCompletedLevelIds, isLevelUnlocked, markLevelComplete } from './progress';
import type { Achievement, HitRadii, ScoreBreakdown, ShotResult } from './scoring';
import {
  computeAchievement,
  computeFinalScore,
  computeFocusAccuracy,
  computeIdentifyScore,
  computeOrientAccuracy,
  computePrecision,
  computeTiming,
  evaluateShot,
  hitRadii,
  safetyPenalty,
} from './scoring';
import type { GameState, LevelConfig, ShotGrade, Vec2 } from './types';
import { EYE_CENTER } from './types';

/** How long the vision-reveal transition runs before the result screen. */
const REVEAL_DURATION = 4.4;

/** How long a grade banner stays on the canvas. */
const GRADE_FLASH_DURATION = 0.9;

/** Half-width, on the 0-100 corneal-power scale, of the "in focus" tolerance band. */
const FOCUS_TOLERANCE = 14;

/** Half-width, in degrees, of the "on axis" tolerance band. */
const ORIENT_TOLERANCE = 12;

/** Fixed timing score applied when a precision stage's clock runs out. */
const TIMEOUT_TIMING_SCORE = 15;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (lo: number, hi: number, t: number) => lo + (hi - lo) * clamp01(t);

/** Small deterministic hash so each patient gets a stable, varied astigmatism axis. */
function hashAxis(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 180;
}

export interface TreatedSpot {
  x: number;
  y: number;
  grade: ShotGrade;
  /** Seconds since this spot was created. */
  age: number;
}

/** Everything the 3D renderer needs during a precision STAGE/COMPLETE/RESULT. */
export interface RenderState {
  state: GameState;
  /** Seconds since the scene mounted — drives all canvas animation. */
  time: number;
  target: Vec2;
  laser: LaserState;
  lock: number;
  readiness: number;
  recoil: number;
  distance: number;
  radii: HitRadii;
  aligned: boolean;
  spots: readonly TreatedSpot[];
  effects: EffectSystem;
  /** 0..1 — rises as treatments complete, used for the haze/clarity effect. */
  clarity: number;
  lastGrade: ShotGrade | null;
  gradeFlashAge: number;
  /** 0..1 progress through the vision-reveal transition. */
  revealProgress: number;
}

export interface Feedback {
  text: string;
  grade: ShotGrade;
  /** Monotonic id so the UI can re-trigger its animation on repeats. */
  id: number;
}

export interface IdentifyFeedback {
  correct: boolean;
  structureId: StructureId;
  id: number;
}

export interface IdentifySnapshot {
  current: StructureId | null;
  index: number;
  total: number;
  hits: number;
  misses: number;
}

export interface HudSnapshot {
  state: GameState;
  level: LevelDefinition | null;
  stageType: StageType | null;
  stageIndex: number;
  stageCount: number;
  patient: Patient;

  // Precision stage (only meaningful while stageType === 'precision').
  precisionName: string;
  precision: number;
  safety: number;
  progress: number;
  total: number;
  elapsedSeconds: number;
  timeLimit: number | null;
  feedback: Feedback | null;
  score: ScoreBreakdown | null;

  // Identify stage.
  identify: IdentifySnapshot;
  identifyFeedback: IdentifyFeedback | null;

  // Focus stage.
  focusAccuracy: number | null;

  // Orient stage.
  orientAccuracy: number | null;

  // Level outcome.
  knowledge: number | null;
  achievement: Achievement | null;
  /** Concept ids unlocked when this level was completed. */
  unlockedThisRun: string[];
}

const FEEDBACK_TEXT: Record<ShotGrade, string> = {
  EXCELLENT: 'PERFECT ALIGNMENT',
  GOOD: 'CLEAN PULSE',
  ACCEPTABLE: 'OFF-CENTRE — TIGHTEN UP',
  MISS: 'MISALIGNED — NO PULSE',
};

type Listener = (snapshot: HudSnapshot) => void;

export class GameEngine {
  private listeners = new Set<Listener>();

  private gameState: GameState = 'MENU';
  private currentLevel: LevelDefinition | null = null;
  private stageIndex = 0;
  private patient: Patient = pickPatient();

  // ------------------------------------------------------------ precision

  private readonly laser = new LaserController();
  private readonly effects = new EffectSystem();
  private radii: HitRadii = hitRadii({
    id: 0,
    name: '',
    targetSpeed: 1,
    targetAmplitude: 1,
    tolerance: 1,
    treatmentCount: 1,
    parTime: 1,
    rampPerSuccess: 0,
  });
  private precisionConfig: LevelConfig | null = null;

  private phase = 0;
  private target: Vec2 = { x: EYE_CENTER.x, y: EYE_CENTER.y };

  private elapsed = 0;
  private wholeSeconds = 0;
  private animTime = 0;
  private revealTimer = 0;

  private accuracies: number[] = [];
  private spots: TreatedSpot[] = [];
  private successes = 0;
  private mistakes = 0;
  private safety = 100;

  private lastGrade: ShotGrade | null = null;
  private gradeFlashAge = GRADE_FLASH_DURATION;
  private feedback: Feedback | null = null;
  private feedbackCounter = 0;

  private score: ScoreBreakdown | null = null;

  // ------------------------------------------------------------ knowledge

  private identifyIndex = 0;
  private identifyHits = 0;
  private identifyMisses = 0;
  private identifyFeedback: IdentifyFeedback | null = null;
  private identifyFeedbackCounter = 0;

  private focusTarget = 50;
  private focusAccuracy: number | null = null;

  private orientTarget = 90;
  private orientAccuracy: number | null = null;

  private knowledge: number | null = null;
  private achievement: Achievement | null = null;
  private unlockedThisRun: string[] = [];

  // ---------------------------------------------------------------- lifecycle

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getHud());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getHud();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private currentStageType(): StageType | null {
    return this.currentLevel?.stages[this.stageIndex] ?? null;
  }

  // ------------------------------------------------------------- navigation

  openLevelSelect(): void {
    this.gameState = 'LEVEL_SELECT';
    this.emit();
  }

  returnToMenu(): void {
    this.gameState = 'MENU';
    this.emit();
  }

  /**
   * Loads a level and starts its first stage. Silently ignored if the level
   * doesn't exist, isn't built yet, or is still locked — the Level Select UI
   * already prevents this, but the engine enforces it too rather than
   * trusting the caller.
   */
  selectLevel(id: number): void {
    const level = getLevel(id);
    if (!level || !level.playable) return;
    if (!isLevelUnlocked(id, getCompletedLevelIds())) return;
    this.loadLevel(level);
  }

  /**
   * Offers the remedial precision drill instead of a numbered level — see
   * `needsPrecisionTraining()`. No unlock check: it's a supplement to the
   * curriculum, not part of its sequence.
   */
  startPrecisionTraining(): void {
    this.loadLevel(PRECISION_TRAINING_LEVEL);
  }

  /** Whether recent precision performance is weak enough to offer a training drill. */
  needsPrecisionTraining(): boolean {
    return computeNeedsPrecisionTraining();
  }

  /** Replays the level (or training drill) currently loaded (used by "Play Again"). */
  replayLevel(): void {
    if (!this.currentLevel) return;
    this.loadLevel(this.currentLevel);
  }

  private loadLevel(level: LevelDefinition): void {
    this.currentLevel = level;
    this.patient = pickPatient(this.patient.id);
    this.stageIndex = 0;
    this.resetLevelState();

    if (this.currentStageType() === 'precision') this.enterPrecisionStage();

    this.gameState = 'STAGE';
    this.emit();
  }

  private resetLevelState(): void {
    this.identifyIndex = 0;
    this.identifyHits = 0;
    this.identifyMisses = 0;
    this.identifyFeedback = null;

    const strength = Math.min(1, Math.abs(this.patient.myopia) / 5);
    this.focusTarget = 50 - (strength * 32 + 8);
    this.focusAccuracy = null;

    this.orientTarget = hashAxis(`${this.patient.id}-axis`);
    this.orientAccuracy = null;

    this.knowledge = null;
    this.achievement = null;
    this.unlockedThisRun = [];

    this.resetPrecisionRun();
  }

  private resetPrecisionRun(): void {
    this.laser.reset();
    this.effects.reset();
    this.phase = 0;
    this.elapsed = 0;
    this.wholeSeconds = 0;
    this.revealTimer = 0;
    this.accuracies = [];
    this.spots = [];
    this.successes = 0;
    this.mistakes = 0;
    this.safety = 100;
    this.lastGrade = null;
    this.gradeFlashAge = GRADE_FLASH_DURATION;
    this.feedback = null;
    this.score = null;
    this.updateTarget(0);
  }

  /** Sets up the precision stage's tuning, adjusting for an 'orient' stage that just ran. */
  private enterPrecisionStage(): void {
    const base = this.currentLevel?.precision;
    if (!base) return;

    let config = base;
    const previous = this.currentLevel?.stages[this.stageIndex - 1];
    if (previous === 'orient' && this.orientAccuracy !== null) {
      // A well-found axis makes the treatment more forgiving; a poor one makes
      // it stricter — the two stages are mechanically linked, not just thematically.
      const factor = lerp(0.65, 1.35, this.orientAccuracy / 100);
      config = { ...base, tolerance: base.tolerance * factor };
    }

    this.precisionConfig = config;
    this.radii = hitRadii(config);
    this.resetPrecisionRun();
  }

  /**
   * Advances past the current stage once its own completion condition is
   * met. No-ops otherwise. Stages call this from their "Continue" action;
   * the precision stage instead finishes itself when treatmentCount (or the
   * clock) is reached, since it's always the last stage in a level.
   */
  advanceStage(): void {
    if (this.gameState !== 'STAGE' || !this.currentLevel) return;

    const stage = this.currentStageType();
    const ready =
      stage === 'identify'
        ? this.identifyIndex >= IDENTIFY_SEQUENCE.length
        : stage === 'focus'
          ? this.focusAccuracy !== null
          : stage === 'orient'
            ? this.orientAccuracy !== null
            : stage === 'plan';
    if (!ready) return;

    this.stageIndex += 1;
    if (this.stageIndex >= this.currentLevel.stages.length) {
      this.finishTeachingLevel();
      return;
    }

    if (this.currentStageType() === 'precision') this.enterPrecisionStage();
    this.emit();
  }

  /** Finishes a level whose last stage was NOT 'precision' — no surgery, no reveal. */
  private finishTeachingLevel(): void {
    if (!this.currentLevel) return;
    this.knowledge = this.knowledgeForCurrentLevel();
    this.achievement = computeAchievement({ knowledge: this.knowledge, precision: null, consistency: null });
    this.score = null;
    this.recordUnlocks(unlockConcepts(this.currentLevel.concepts));
    markLevelComplete(this.currentLevel.id);
    this.gameState = 'RESULT';
    this.emit();
  }

  private knowledgeForCurrentLevel(): number | null {
    const stages = this.currentLevel?.stages ?? [];
    if (stages.includes('identify')) return computeIdentifyScore(this.identifyHits, this.identifyMisses);
    if (stages.includes('orient')) return this.orientAccuracy ?? 0;
    if (stages.includes('focus')) return this.focusAccuracy ?? 0;
    if (stages.includes('plan')) return 100;
    return null;
  }

  private recordUnlocks(freshIds: string[]): void {
    if (freshIds.length === 0) return;
    this.unlockedThisRun.push(...freshIds);
  }

  // ------------------------------------------------------------------ update

  /** Advances the simulation. `dtMs` is the frame delta in milliseconds. */
  update(dtMs: number): void {
    // Clamp so a backgrounded tab doesn't teleport the target on return.
    const dt = Math.min(dtMs, 50) / 1000;
    this.animTime += dt;
    this.effects.update(dt);

    for (const spot of this.spots) spot.age += dt;
    if (this.gradeFlashAge < GRADE_FLASH_DURATION) this.gradeFlashAge += dt;

    if (this.gameState === 'STAGE' && this.currentStageType() === 'precision' && this.precisionConfig) {
      this.elapsed += dt;
      this.updateTarget(dt);
      this.laser.update(dt, this.target, this.radii);

      const limit = this.precisionConfig.timeLimit;
      if (limit && this.elapsed >= limit && this.successes < this.precisionConfig.treatmentCount) {
        this.finishPrecisionStage(true);
        return;
      }

      const seconds = Math.floor(this.elapsed);
      if (seconds !== this.wholeSeconds) {
        this.wholeSeconds = seconds;
        this.emit();
      }
      return;
    }

    if (this.gameState === 'COMPLETE') {
      this.revealTimer += dt;
      if (this.revealTimer >= REVEAL_DURATION) {
        this.gameState = 'RESULT';
        this.emit();
      }
    }
  }

  private updateTarget(dt: number): void {
    const cfg = this.precisionConfig;
    if (!cfg) return;
    const ramp = 1 + cfg.rampPerSuccess * this.successes;
    this.phase += dt * cfg.targetSpeed * ramp;

    const amp = cfg.targetAmplitude;
    this.target = {
      x: EYE_CENTER.x + Math.sin(this.phase) * amp,
      y: EYE_CENTER.y + Math.cos(this.phase * 0.8) * amp * 0.62,
    };
  }

  // -------------------------------------------------------------- identify

  tapStructure(id: StructureId): void {
    if (this.gameState !== 'STAGE' || this.currentStageType() !== 'identify') return;
    if (this.identifyIndex >= IDENTIFY_SEQUENCE.length) return;

    const expected = IDENTIFY_SEQUENCE[this.identifyIndex];
    const correct = id === expected;
    this.identifyFeedbackCounter += 1;
    this.identifyFeedback = { correct, structureId: id, id: this.identifyFeedbackCounter };

    if (correct) {
      this.identifyHits += 1;
      this.identifyIndex += 1;
      this.effects.addFlash(0.25);
      play('good');
    } else {
      this.identifyMisses += 1;
      play('miss');
    }
    this.emit();
  }

  // ----------------------------------------------------------------- focus

  /** Pure preview so the ray diagram can draw live geometry without exposing the target value. */
  getFocusTarget(): number {
    return this.focusTarget;
  }

  submitFocus(value: number): void {
    if (this.gameState !== 'STAGE' || this.currentStageType() !== 'focus') return;
    this.focusAccuracy = computeFocusAccuracy(value, this.focusTarget, FOCUS_TOLERANCE);
    this.emit();
  }

  // ---------------------------------------------------------------- orient

  getOrientTarget(): number {
    return this.orientTarget;
  }

  submitOrientation(valueDeg: number): void {
    if (this.gameState !== 'STAGE' || this.currentStageType() !== 'orient') return;
    this.orientAccuracy = computeOrientAccuracy(valueDeg, this.orientTarget, ORIENT_TOLERANCE);
    this.emit();
  }

  // ------------------------------------------------------------- precision

  setPointer(x: number, y: number): void {
    this.laser.setPointer(x, y);
  }

  /** Attempts a treatment pulse. Ignored outside the precision stage or during cooldown. */
  fire(): void {
    if (this.gameState !== 'STAGE' || this.currentStageType() !== 'precision') return;
    if (!this.laser.fire()) return;

    const distance = this.laser.distanceTo(this.target);
    const result = evaluateShot(distance, this.radii, this.laser.lock);
    this.applyShot(result);
  }

  private applyShot(result: ShotResult): void {
    this.safety = Math.max(0, this.safety - safetyPenalty(result.grade));
    this.lastGrade = result.grade;
    this.gradeFlashAge = 0;
    this.feedbackCounter += 1;
    this.feedback = {
      text: FEEDBACK_TEXT[result.grade],
      grade: result.grade,
      id: this.feedbackCounter,
    };

    if (result.grade === 'MISS') {
      this.mistakes += 1;
      this.laser.lock = 0;
      this.effects.addShake(9);
      this.effects.burst(this.laser.state.x, this.laser.state.y, 10, 8, 150);
      play('miss');
      this.emit();
      return;
    }

    this.successes += 1;
    this.accuracies.push(result.accuracy);
    this.spots.push({ x: this.target.x, y: this.target.y, grade: result.grade, age: 0 });

    const hue = result.grade === 'EXCELLENT' ? 168 : 196;
    this.effects.burst(this.target.x, this.target.y, result.grade === 'EXCELLENT' ? 26 : 16, hue, 260);
    this.effects.addFlash(result.grade === 'EXCELLENT' ? 0.42 : 0.26);
    play(result.grade === 'EXCELLENT' ? 'excellent' : result.grade === 'GOOD' ? 'good' : 'acceptable');

    if (this.precisionConfig && this.successes >= this.precisionConfig.treatmentCount) {
      this.finishPrecisionStage(false);
      return;
    }

    this.emit();
  }

  private finishPrecisionStage(timedOut: boolean): void {
    if (!this.currentLevel || !this.precisionConfig) return;

    const precision = computePrecision(this.accuracies);
    const timing = timedOut ? TIMEOUT_TIMING_SCORE : computeTiming(this.elapsed, this.precisionConfig);
    this.score = computeFinalScore(precision, this.safety, timing);

    this.knowledge = this.knowledgeForCurrentLevel();
    this.achievement = computeAchievement({ knowledge: this.knowledge, precision, consistency: this.safety });

    this.recordUnlocks(unlockConcepts(this.currentLevel.concepts));
    if (this.currentLevel.id > 0) {
      // A numbered curriculum level: count toward progression and adaptive
      // difficulty. The remedial drill itself (id 0) does neither — it's a
      // supplement, not a level, and its own score shouldn't feed the same
      // history that decided to offer it.
      markLevelComplete(this.currentLevel.id);
      recordPrecisionAttempt(precision);
    } else {
      resetPrecisionHistory();
    }

    this.effects.addFlash(1);
    play('complete');

    this.gameState = 'COMPLETE';
    this.revealTimer = 0;
    this.emit();
  }

  /** Skips the remainder of the vision-reveal transition. */
  skipReveal(): void {
    if (this.gameState !== 'COMPLETE') return;
    this.gameState = 'RESULT';
    this.emit();
  }

  // ----------------------------------------------------------------- readers

  getState(): GameState {
    return this.gameState;
  }

  getHud(): HudSnapshot {
    const cfg = this.precisionConfig;
    return {
      state: this.gameState,
      level: this.currentLevel,
      stageType: this.currentStageType(),
      stageIndex: this.stageIndex,
      stageCount: this.currentLevel?.stages.length ?? 0,
      patient: this.patient,

      precisionName: cfg?.name ?? '',
      precision: Math.round(computePrecision(this.accuracies)),
      safety: Math.round(this.safety),
      progress: this.successes,
      total: cfg?.treatmentCount ?? 0,
      elapsedSeconds: Math.floor(this.elapsed),
      timeLimit: cfg?.timeLimit ?? null,
      feedback: this.feedback,
      score: this.score,

      identify: {
        current: IDENTIFY_SEQUENCE[this.identifyIndex] ?? null,
        index: this.identifyIndex,
        total: IDENTIFY_SEQUENCE.length,
        hits: this.identifyHits,
        misses: this.identifyMisses,
      },
      identifyFeedback: this.identifyFeedback,

      focusAccuracy: this.focusAccuracy,
      orientAccuracy: this.orientAccuracy,

      knowledge: this.knowledge,
      achievement: this.achievement,
      unlockedThisRun: this.unlockedThisRun,
    };
  }

  getRenderState(): RenderState {
    const cfg = this.precisionConfig;
    return {
      state: this.gameState,
      time: this.animTime,
      target: this.target,
      laser: this.laser.state,
      lock: this.laser.lock,
      readiness: this.laser.readiness,
      recoil: this.laser.recoil,
      distance: this.laser.distance,
      radii: this.radii,
      aligned: this.laser.distance <= this.radii.good,
      spots: this.spots,
      effects: this.effects,
      clarity: cfg ? this.successes / cfg.treatmentCount : 0,
      lastGrade: this.lastGrade,
      gradeFlashAge: this.gradeFlashAge,
      revealProgress: Math.min(1, this.revealTimer / REVEAL_DURATION),
    };
  }

  /** Exposed for debugging and future level-summary screens. */
  getMistakes(): number {
    return this.mistakes;
  }
}
