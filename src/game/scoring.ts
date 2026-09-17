/**
 * Scoring model. Pure functions — no engine or rendering state involved.
 */

import type { LevelConfig, ShotGrade } from './types';

/** Hit radii, in arena units, before the level tolerance multiplier. */
const BASE_RADIUS = {
  excellent: 18,
  good: 34,
  acceptable: 52,
} as const;

export interface HitRadii {
  excellent: number;
  good: number;
  acceptable: number;
}

export function hitRadii(level: LevelConfig): HitRadii {
  return {
    excellent: BASE_RADIUS.excellent * level.tolerance,
    good: BASE_RADIUS.good * level.tolerance,
    acceptable: BASE_RADIUS.acceptable * level.tolerance,
  };
}

export interface ShotResult {
  grade: ShotGrade;
  /** 0 for a miss, otherwise 60..100. */
  accuracy: number;
  distance: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Linear interpolation of `t` in [0,1] across [lo, hi]. */
const lerp = (lo: number, hi: number, t: number) => lo + (hi - lo) * t;

/**
 * Converts a distance-from-target into a graded accuracy.
 *
 * `lock` (0..1) is how long the player has been tracking the target before
 * firing. Holding a lock shrinks the effective distance slightly, so patient
 * tracking beats lucky clicking — but it can never push a shot past 100%.
 */
export function evaluateShot(distance: number, radii: HitRadii, lock = 0): ShotResult {
  const effective = distance * (1 - 0.15 * clamp(lock, 0, 1));

  if (effective <= radii.excellent) {
    const t = 1 - effective / radii.excellent;
    return { grade: 'EXCELLENT', accuracy: lerp(95, 100, t), distance };
  }
  if (effective <= radii.good) {
    const t = 1 - (effective - radii.excellent) / (radii.good - radii.excellent);
    return { grade: 'GOOD', accuracy: lerp(75, 94, t), distance };
  }
  if (effective <= radii.acceptable) {
    const t = 1 - (effective - radii.good) / (radii.acceptable - radii.good);
    return { grade: 'ACCEPTABLE', accuracy: lerp(60, 74, t), distance };
  }
  return { grade: 'MISS', accuracy: 0, distance };
}

/** Safety cost of a single attempt. Safety starts at 100 and only goes down. */
export function safetyPenalty(grade: ShotGrade): number {
  switch (grade) {
    case 'MISS':
      return 8;
    case 'ACCEPTABLE':
      return 1.5;
    default:
      return 0;
  }
}

/** Average accuracy of the successful treatments, 0..100. */
export function computePrecision(accuracies: readonly number[]): number {
  if (accuracies.length === 0) return 0;
  const sum = accuracies.reduce((acc, value) => acc + value, 0);
  return clamp(sum / accuracies.length, 0, 100);
}

/**
 * Rewards efficient completion. Finishing at or under par is full marks;
 * after that the score decays gently rather than falling off a cliff.
 */
export function computeTiming(elapsedSeconds: number, level: LevelConfig): number {
  if (elapsedSeconds <= level.parTime) return 100;
  return clamp(100 - (elapsedSeconds - level.parTime) * 1.4, 25, 100);
}

export interface ScoreBreakdown {
  precision: number;
  safety: number;
  timing: number;
  finalScore: number;
  stars: number;
}

export function computeFinalScore(
  precision: number,
  safety: number,
  timing: number,
): ScoreBreakdown {
  const p = clamp(precision, 0, 100);
  const s = clamp(safety, 0, 100);
  const t = clamp(timing, 0, 100);
  const finalScore = clamp(p * 0.5 + s * 0.3 + t * 0.2, 0, 100);
  return { precision: p, safety: s, timing: t, finalScore, stars: starsFor(finalScore) };
}

export function starsFor(finalScore: number): number {
  if (finalScore >= 95) return 5;
  if (finalScore >= 85) return 4;
  if (finalScore >= 72) return 3;
  if (finalScore >= 58) return 2;
  return 1;
}

export function rankFor(finalScore: number): string {
  if (finalScore >= 95) return 'FLAWLESS';
  if (finalScore >= 85) return 'EXCELLENT';
  if (finalScore >= 72) return 'SOLID';
  if (finalScore >= 58) return 'SHAKY';
  return 'ROUGH';
}

// --------------------------------------------------------- knowledge layer

/** How well the player identified the three anatomical structures, 0..100. */
export function computeIdentifyScore(hits: number, misses: number): number {
  const attempts = hits + misses;
  if (attempts === 0) return 0;
  return clamp((hits / attempts) * 100, 0, 100);
}

/** How close the focus-challenge slider landed to the correct value, 0..100. */
export function computeFocusAccuracy(value: number, target: number, tolerance: number): number {
  const error = Math.abs(value - target);
  return clamp(100 - (error / tolerance) * 100, 0, 100);
}

/**
 * How close an astigmatism-axis dial (0-180°, wrapping — an axis and its
 * 180°-rotated twin are the same axis) landed to the correct value, 0..100.
 */
export function computeOrientAccuracy(valueDeg: number, targetDeg: number, toleranceDeg: number): number {
  const raw = Math.abs(valueDeg - targetDeg) % 180;
  const error = Math.min(raw, 180 - raw);
  return clamp(100 - (error / toleranceDeg) * 100, 0, 100);
}

/**
 * Achievement identity — a title the player earns, not just a number.
 * Blends knowledge in alongside surgical performance so understanding the
 * "why" actually counts toward the outcome, not just clicking accurately.
 */
export interface Achievement {
  rank: string;
  nextRank: string | null;
  overall: number;
}

const RANK_LADDER: readonly { min: number; title: string }[] = [
  { min: 0, title: 'LASIK TRAINEE' },
  { min: 50, title: 'LASIK APPRENTICE' },
  { min: 70, title: 'PRECISION APPRENTICE' },
  { min: 85, title: 'PRECISION SPECIALIST' },
  { min: 95, title: 'MASTER TECHNICIAN' },
];

export interface AchievementParts {
  /** Present when the level had an identify/focus/orient stage. */
  knowledge?: number | null;
  /** Present when the level had a precision stage. */
  precision?: number | null;
  consistency?: number | null;
}

const ACHIEVEMENT_WEIGHTS = { knowledge: 0.3, precision: 0.4, consistency: 0.3 } as const;

/**
 * Blends whichever dimensions this level actually exercised, renormalising
 * weights over the ones present — a pure-teaching level (knowledge only)
 * and a pure-precision level (precision + consistency only) both get a
 * fair 0-100 overall instead of being dragged down by a dimension the
 * level never tested.
 */
export function computeAchievement(parts: AchievementParts): Achievement {
  let sum = 0;
  let weightSum = 0;
  (Object.keys(ACHIEVEMENT_WEIGHTS) as (keyof typeof ACHIEVEMENT_WEIGHTS)[]).forEach((key) => {
    const value = parts[key];
    if (value === null || value === undefined) return;
    sum += value * ACHIEVEMENT_WEIGHTS[key];
    weightSum += ACHIEVEMENT_WEIGHTS[key];
  });
  const overall = weightSum > 0 ? clamp(sum / weightSum, 0, 100) : 0;

  let idx = 0;
  for (let i = 0; i < RANK_LADDER.length; i += 1) {
    if (overall >= RANK_LADDER[i].min) idx = i;
  }
  const nextRank = idx < RANK_LADDER.length - 1 ? RANK_LADDER[idx + 1].title : null;
  return { rank: RANK_LADDER[idx].title, nextRank, overall };
}
