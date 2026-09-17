/**
 * Shared game types and arena constants.
 *
 * The arena is a fixed internal coordinate space (16:10). The canvas is scaled
 * visually to fit the viewport, but all game logic works in these units so the
 * simulation is resolution-independent (and portable to WebGL later).
 */

export const ARENA_WIDTH = 1280;
export const ARENA_HEIGHT = 800;

/** Centre of the eye inside the arena. */
export const EYE_CENTER: Readonly<Vec2> = { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 };

/** Radius the laser crosshair is confined to, so it never leaves the eye. */
export const PLAYABLE_RADIUS = 300;

/**
 * Iris/pupil radii, in arena units, for the 3D front-view eye used during
 * SURGERY. (Anatomy identification uses the 2D cross-section diagram instead,
 * which hit-tests by shape id, not by radius — see src/game/curriculum.ts.)
 */
export const IRIS_RADIUS = 140;
export const PUPIL_RADIUS = 46;

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * A level is a sequence of stages (see src/game/levels.ts); the engine just
 * walks that sequence rather than hardcoding one level's flow:
 *   MENU → LEVEL_SELECT → STAGE (× however many the level has) →
 *   [COMPLETE — only when the last stage is 'precision', for the vision
 *   reveal] → RESULT (achievement or light level-complete card)
 */
export type GameState = 'MENU' | 'LEVEL_SELECT' | 'STAGE' | 'COMPLETE' | 'RESULT';

/** Quality tiers for a single treatment attempt. */
export type ShotGrade = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'MISS';

/**
 * Tunable parameters for a level. Only Level 1 ships in V0, but every gameplay
 * constant that future levels would want to change lives here.
 */
export interface LevelConfig {
  id: number;
  name: string;
  /** Angular speed of the target path, radians per second. */
  targetSpeed: number;
  /** Horizontal amplitude of the target path, in arena units. */
  targetAmplitude: number;
  /** Multiplier on the hit radii. > 1 is more forgiving. */
  tolerance: number;
  /** Successful treatments required to finish the level. */
  treatmentCount: number;
  /** Optional hard limit, in seconds. Unused in Level 1. */
  timeLimit?: number;
  /** Target completion time, in seconds, for a perfect timing score. */
  parTime: number;
  /** Speed-up applied per successful treatment, as a fraction. */
  rampPerSuccess: number;
}
