/**
 * Procedural canvas textures for the 3D eye. Generated once at scene start —
 * no image assets to ship.
 */

import * as THREE from 'three';

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for texture generation');
  return { canvas, ctx };
}

/** Radial fibre + crypt pattern for the iris, tinted teal to match the game's palette. */
export function buildIrisTexture(size = 512): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  const base = ctx.createRadialGradient(cx, cy, r * 0.16, cx, cy, r);
  base.addColorStop(0, '#0e5f74');
  base.addColorStop(0.45, '#1b8fa8');
  base.addColorStop(0.82, '#25b6c9');
  base.addColorStop(1, '#0a3a4d');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Radial fibres.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const fibreCount = 140;
  for (let i = 0; i < fibreCount; i += 1) {
    const a = (i / fibreCount) * Math.PI * 2;
    const inner = r * 0.2;
    const outer = r * (0.7 + ((i * 37) % 23) / 90);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(190, 250, 255, 0.16)' : 'rgba(4, 34, 48, 0.26)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }

  // Collarette — the wavy inner ring real irises show around the pupil.
  ctx.strokeStyle = 'rgba(6, 40, 52, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * Math.PI * 2;
    const wobble = Math.sin(a * 7) * r * 0.02;
    const rad = r * 0.32 + wobble;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Crypts — small dark flecks scattered toward the outer iris.
  for (let i = 0; i < 46; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const rad = r * (0.45 + Math.random() * 0.42);
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    ctx.fillStyle = `rgba(3, 28, 38, ${0.15 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.5 + Math.random() * 4, 4 + Math.random() * 7, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Cream sclera base with faint branching vessels, mapped onto the eyeball sphere. */
export function buildScleraTexture(width = 1024, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for texture generation');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#f1f7fa');
  base.addColorStop(0.55, '#e6eef3');
  base.addColorStop(1, '#c9d7e0');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // Faint speckle noise for an organic, non-plastic surface.
  for (let i = 0; i < 2200; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = `rgba(150, 170, 185, ${Math.random() * 0.06})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Thin branching vessels concentrated near the visible front band.
  const bandY = height * 0.5;
  for (let i = 0; i < 26; i += 1) {
    const startX = Math.random() * width;
    const startY = bandY + (Math.random() - 0.5) * height * 0.55;
    ctx.strokeStyle = `rgba(198, 88, 88, ${0.12 + Math.random() * 0.16})`;
    ctx.lineWidth = 0.6 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let x = startX;
    let y = startY;
    const branches = 3 + Math.floor(Math.random() * 3);
    for (let b = 0; b < branches; b += 1) {
      const nx = x + (Math.random() - 0.5) * 90;
      const ny = y + (Math.random() - 0.5) * 40;
      ctx.quadraticCurveTo(x + (nx - x) / 2, y, nx, ny);
      x = nx;
      y = ny;
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Soft radial glow used for halos, muzzle flashes and treated-spot sprites. */
export function buildGlowTexture(size = 128): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
