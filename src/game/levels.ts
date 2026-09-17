/**
 * The level roster: what a level is made of, and the full 100-level map.
 *
 * A level is just an ordered list of stage types plus stage-specific config —
 * new levels are data, not new code. Only the first ten are implemented
 * (`playable: true`); the rest are an honest roadmap, shown locked in the
 * Level Select screen exactly like the Knowledge Cabinet already shows
 * locked future concepts.
 *
 * Every level also runs on a named "machine" — the player isn't just
 * unlocking levels, they're building out an eye lab one instrument at a
 * time. The machine is presentation, not a new mechanic: it's still one of
 * the five StageTypes underneath.
 */

import type { LevelConfig } from './types';

/**
 * The five reusable mechanics every level is built from:
 *  - identify  — tap-to-find on the anatomical cross-section
 *  - focus     — ray-tracing diagram, drag corneal power to converge on the retina
 *  - orient    — ray-tracing diagram, drag a rotation axis to correct astigmatism
 *  - plan      — the patient case + concept briefing
 *  - precision — the mouse-driven laser-tracking mechanic
 */
export type StageType = 'identify' | 'focus' | 'orient' | 'plan' | 'precision';

export interface Machine {
  icon: string;
  name: string;
}

export interface LevelDefinition {
  id: number;
  code: string;
  name: string;
  tagline: string;
  /** The instrument this level's stages run on — see the file comment. */
  machine: Machine;
  /** Ordered stages this level runs through. */
  stages: readonly StageType[];
  /** Config for the level's 'precision' stage, if it has one. */
  precision?: LevelConfig;
  /** Concept ids this level can unlock, in curriculum.ts. */
  concepts: readonly string[];
  /** Whether this level actually exists yet. */
  playable: boolean;
  /**
   * Scaffolding for a future paid tier — no purchase flow exists in this
   * build, so it currently has no effect on what's playable. It just means
   * "a store integration would gate this level" when one gets built.
   */
  premium: boolean;
}

export interface Chapter {
  title: string;
  range: readonly [number, number];
}

export const CHAPTERS: readonly Chapter[] = [
  { title: 'Foundations', range: [1, 10] },
  { title: 'Astigmatism Mastery', range: [11, 20] },
  { title: 'Speed & Pressure', range: [21, 30] },
  { title: 'Steady Hands II', range: [31, 40] },
  { title: 'Low-Light Precision', range: [41, 50] },
  { title: 'Multi-Target Procedures', range: [51, 60] },
  { title: 'Unexpected Events', range: [61, 70] },
  { title: 'Marathon Shifts', range: [71, 80] },
  { title: 'Expert Certification', range: [81, 90] },
  { title: 'Master Technician Trials', range: [91, 100] },
];

const BASE_PRECISION: LevelConfig = {
  id: 4,
  name: 'STEADY HANDS',
  targetSpeed: 0.85,
  targetAmplitude: 112,
  tolerance: 1.35,
  treatmentCount: 10,
  parTime: 42,
  rampPerSuccess: 0.035,
};

const LEVEL_DEFS: readonly LevelDefinition[] = [
  {
    id: 1,
    code: 'L01',
    name: 'MEET THE EYE',
    tagline: 'Identify eight structures, in the order light travels through them.',
    machine: { icon: '👁️', name: 'Ocular Scanner' },
    stages: ['identify'],
    concepts: ['cornea', 'pupil', 'iris', 'lens', 'vitreous', 'retina', 'macula', 'optic-nerve'],
    playable: true,
    premium: false,
  },
  {
    id: 2,
    code: 'L02',
    name: 'WHY IS VISION BLURRY?',
    tagline: "Bring a myopic eye's focus back onto the retina.",
    machine: { icon: '🔬', name: 'Corneal Mapper' },
    stages: ['focus'],
    concepts: ['myopia'],
    playable: true,
    premium: false,
  },
  {
    id: 3,
    code: 'L03',
    name: 'PLAN THE TREATMENT',
    tagline: "Learn what LASIK actually reshapes, and why.",
    machine: { icon: '🧠', name: 'Treatment Planner' },
    stages: ['plan'],
    concepts: ['corneal-layers', 'lasik-concept'],
    playable: true,
    premium: false,
  },
  {
    id: 4,
    code: 'L04',
    name: 'STEADY HANDS',
    tagline: 'Ten clean pulses. Forgiving tolerance, no clock.',
    machine: { icon: '🎯', name: 'Precision Tracker' },
    stages: ['precision'],
    precision: { ...BASE_PRECISION, id: 4, name: 'STEADY HANDS' },
    concepts: ['laser-alignment'],
    playable: true,
    premium: true,
  },
  {
    id: 5,
    code: 'L05',
    name: 'TIGHTER TOLERANCE',
    tagline: 'The same procedure — with a much smaller margin for error.',
    machine: { icon: '🎯', name: 'Precision Tracker II' },
    stages: ['precision'],
    precision: { ...BASE_PRECISION, id: 5, name: 'TIGHTER TOLERANCE', tolerance: 0.85 },
    concepts: ['tighter-tolerance'],
    playable: true,
    premium: true,
  },
  {
    id: 6,
    code: 'L06',
    name: 'FASTER TARGET',
    tagline: 'The treatment marker moves quicker, and keeps accelerating.',
    machine: { icon: '📡', name: 'Eye Tracker' },
    stages: ['precision'],
    precision: {
      ...BASE_PRECISION,
      id: 6,
      name: 'FASTER TARGET',
      targetSpeed: 1.3,
      rampPerSuccess: 0.07,
      tolerance: 1.1,
    },
    concepts: ['target-tracking'],
    playable: true,
    premium: true,
  },
  {
    id: 7,
    code: 'L07',
    name: "ASTIGMATISM: FIND THE AXIS",
    tagline: 'A blurred point, stretched along an axis. Rotate until it rounds out.',
    machine: { icon: '🌀', name: 'Astigmatism Axis Module' },
    stages: ['orient'],
    concepts: ['astigmatism-axis'],
    playable: true,
    premium: true,
  },
  {
    id: 8,
    code: 'L08',
    name: 'ASTIGMATISM: COMBINED CORRECTION',
    tagline: "Lock the axis first — it decides how forgiving the laser stage will be.",
    machine: { icon: '🌀', name: 'Axis + Laser Suite' },
    stages: ['orient', 'precision'],
    precision: { ...BASE_PRECISION, id: 8, name: 'COMBINED CORRECTION', tolerance: 1.0 },
    concepts: ['astigmatism-correction'],
    playable: true,
    premium: true,
  },
  {
    id: 9,
    code: 'L09',
    name: 'TIME PRESSURE',
    tagline: 'Same tolerance as Steady Hands — but the clock is now part of the job.',
    machine: { icon: '⚡', name: 'Advanced Laser Suite' },
    stages: ['precision'],
    precision: { ...BASE_PRECISION, id: 9, name: 'TIME PRESSURE', timeLimit: 26, parTime: 22 },
    concepts: ['time-pressure'],
    playable: true,
    premium: true,
  },
  {
    id: 10,
    code: 'L10',
    name: 'MULTI-PARAMETER MASTERY',
    tagline: 'Tight tolerance, a fast target, and a clock — all at once.',
    machine: { icon: '🏆', name: 'Master Ophthalmic Lab' },
    stages: ['precision'],
    precision: {
      ...BASE_PRECISION,
      id: 10,
      name: 'MULTI-PARAMETER MASTERY',
      tolerance: 0.9,
      targetSpeed: 1.15,
      rampPerSuccess: 0.05,
      timeLimit: 30,
      parTime: 26,
    },
    concepts: ['mastery'],
    playable: true,
    premium: true,
  },
];

function stubLevel(id: number): LevelDefinition {
  const chapter = CHAPTERS.find((c) => id >= c.range[0] && id <= c.range[1]);
  return {
    id,
    code: `L${String(id).padStart(2, '0')}`,
    name: chapter ? chapter.title : 'UNCHARTED',
    tagline: 'Not yet built — architecture is ready, content isn\'t.',
    machine: { icon: '🔒', name: 'Uninstalled' },
    stages: [],
    concepts: [],
    playable: false,
    premium: true,
  };
}

/** All 100 level slots. Only the first ten (`playable: true`) actually run. */
export const LEVELS: readonly LevelDefinition[] = [
  ...LEVEL_DEFS,
  ...Array.from({ length: 90 }, (_, i) => stubLevel(i + 11)),
];

export function getLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((l) => l.id === id);
}

export const TOTAL_LEVELS = LEVELS.length;
export const PLAYABLE_LEVEL_COUNT = LEVEL_DEFS.length;

/**
 * A remedial drill, not a numbered curriculum level — GameEngine offers it
 * when a player's recent precision has been consistently weak (see
 * src/game/adaptive.ts). Deliberately generous: the point is to rebuild
 * confidence before returning to the curriculum, not to gate it further.
 */
export const PRECISION_TRAINING_LEVEL: LevelDefinition = {
  id: 0,
  code: 'TR',
  name: 'PRECISION TRAINING',
  tagline: 'A short, focused drill — no time limit, generous tolerance.',
  machine: { icon: '⚡', name: 'Precision Drill Rig' },
  stages: ['precision'],
  precision: {
    id: 0,
    name: 'PRECISION TRAINING',
    targetSpeed: 0.6,
    targetAmplitude: 95,
    tolerance: 1.6,
    treatmentCount: 6,
    parTime: 30,
    rampPerSuccess: 0.02,
  },
  concepts: ['precision-training'],
  playable: true,
  premium: false,
};
