/**
 * Laser controller: owns the crosshair the player drives with the pointer.
 *
 * Knows nothing about rendering — it tracks a position, keeps it inside the
 * playable region, and reports how well aligned it currently is.
 */

import type { HitRadii } from './scoring';
import type { Vec2 } from './types';
import { EYE_CENTER, PLAYABLE_RADIUS } from './types';

export interface LaserState {
  x: number;
  y: number;
  active: boolean;
}

/** Cooldown between attempts, in milliseconds. Stops click-spamming. */
const FIRE_COOLDOWN_MS = 230;

/** How fast the alignment lock fills and drains, in units per second. */
const LOCK_FILL_RATE = 1.6;
const LOCK_DRAIN_RATE = 2.4;

export class LaserController {
  readonly state: LaserState = { x: EYE_CENTER.x, y: EYE_CENTER.y, active: false };

  /** Smoothed distance to the target, in arena units. */
  distance = Number.POSITIVE_INFINITY;

  /** 0..1 — how long the player has held good alignment. */
  lock = 0;

  /** 0..1 — how close to firing again the player is (1 = ready). */
  readiness = 1;

  /** Decaying kick applied to the crosshair visuals right after a shot. */
  recoil = 0;

  private cooldown = 0;

  /** Moves the crosshair, clamped to a circle so it can never leave the eye. */
  setPointer(x: number, y: number): void {
    const dx = x - EYE_CENTER.x;
    const dy = y - EYE_CENTER.y;
    const dist = Math.hypot(dx, dy);

    if (dist > PLAYABLE_RADIUS && dist > 0) {
      const k = PLAYABLE_RADIUS / dist;
      this.state.x = EYE_CENTER.x + dx * k;
      this.state.y = EYE_CENTER.y + dy * k;
    } else {
      this.state.x = x;
      this.state.y = y;
    }
  }

  distanceTo(target: Vec2): number {
    return Math.hypot(this.state.x - target.x, this.state.y - target.y);
  }

  /** Advances cooldown, lock and recoil. `dt` is in seconds. */
  update(dt: number, target: Vec2, radii: HitRadii): void {
    this.distance = this.distanceTo(target);

    const aligned = this.distance <= radii.good;
    this.lock = Math.min(
      1,
      Math.max(0, this.lock + (aligned ? LOCK_FILL_RATE : -LOCK_DRAIN_RATE) * dt),
    );

    this.cooldown = Math.max(0, this.cooldown - dt * 1000);
    this.readiness = 1 - this.cooldown / FIRE_COOLDOWN_MS;
    this.state.active = this.cooldown === 0;

    this.recoil = Math.max(0, this.recoil - dt * 4);
  }

  /** Returns false when the shot was swallowed by the cooldown. */
  fire(): boolean {
    if (this.cooldown > 0) return false;
    this.cooldown = FIRE_COOLDOWN_MS;
    this.recoil = 1;
    return true;
  }

  reset(): void {
    this.state.x = EYE_CENTER.x;
    this.state.y = EYE_CENTER.y;
    this.state.active = false;
    this.distance = Number.POSITIVE_INFINITY;
    this.lock = 0;
    this.readiness = 1;
    this.recoil = 0;
    this.cooldown = 0;
  }
}
