/**
 * Lightweight particle and flash effects. Pure simulation — the renderer only
 * reads the resulting arrays.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

const MAX_PARTICLES = 220;

export class EffectSystem {
  readonly particles: Particle[] = [];

  /** 0..1 full-screen flash, decays on its own. */
  flash = 0;

  /** Screen shake magnitude in arena units, decays on its own. */
  shake = 0;

  burst(x: number, y: number, count: number, hue: number, speed: number): void {
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      const maxLife = 0.35 + Math.random() * 0.45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: maxLife,
        maxLife,
        size: 1.4 + Math.random() * 2.6,
        hue: hue + (Math.random() * 30 - 15),
      });
    }
  }

  addFlash(amount: number): void {
    this.flash = Math.min(1, this.flash + amount);
  }

  addShake(amount: number): void {
    this.shake = Math.min(26, this.shake + amount);
  }

  /** `dt` in seconds. */
  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.8 * dt;
      p.vy *= 1 - 1.8 * dt;
    }

    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.shake = Math.max(0, this.shake - dt * 48);
  }

  reset(): void {
    this.particles.length = 0;
    this.flash = 0;
    this.shake = 0;
  }
}
