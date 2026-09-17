/**
 * Three.js renderer for the eye stage.
 *
 * Mirrors the contract the old Canvas2D renderer had: construct once with a
 * canvas element, call `resize()` when the container changes, call
 * `render(state)` once per frame, and `dispose()` on teardown. Nothing here
 * is imported by src/game/* — the engine stays renderer-agnostic.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { RenderState } from '../GameEngine';
import {
  ARENA_ASPECT,
  CORNEA_APEX_Z,
  CORNEA_DOME_RADIUS,
  EYEBALL_CENTER_Z,
  EYEBALL_RADIUS,
  HUD_LAYER_Z,
  IRIS_RADIUS,
  IRIS_Z,
  PALETTE,
  PUPIL_RADIUS_BASE,
  arenaToWorld,
} from './constants';
import { buildGlowTexture, buildIrisTexture, buildScleraTexture } from './textures';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../types';

const CAMERA_DISTANCE = 1000;
const MAX_PARTICLES = 220;
const MAX_SPOTS = 40;
const ARC_SEGMENTS = 64;

/** A partial-circle outline whose visible length can be swept each frame via drawRange. */
function makeSweepLine(radius: number, color: number, opacity: number): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i += 1) {
    const a = -Math.PI / 2 + (i / ARC_SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  return line;
}

function setSweep(line: THREE.Line, progress: number): void {
  const count = Math.max(0, Math.min(ARC_SEGMENTS + 1, Math.round((ARC_SEGMENTS + 1) * progress)));
  line.geometry.setDrawRange(0, count);
  line.visible = count > 1;
}

function makeDashedCircle(radius: number, color: number, opacity: number, dashSize: number): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i += 1) {
    const a = (i / ARC_SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color,
    transparent: true,
    opacity,
    dashSize,
    gapSize: dashSize * 1.4,
  });
  const loop = new THREE.LineLoop(geometry, material);
  loop.computeLineDistances();
  loop.frustumCulled = false;
  return loop;
}

export class EyeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private cameraBase = new THREE.Vector3(0, 0, CAMERA_DISTANCE);

  /** Post-processing: the corneal highlight and treatment flashes get a real glow, not a flat sprite. */
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;

  private eyeball!: THREE.Mesh;
  private iris!: THREE.Mesh;
  private pupil!: THREE.Mesh;
  private cornea!: THREE.Mesh;
  private limbus!: THREE.Mesh;
  private caruncle!: THREE.Mesh;
  private lidRimOuter!: THREE.Line;

  private zoneRingOuter!: THREE.LineLoop;
  private zoneRingInner!: THREE.LineLoop;

  private targetGroup!: THREE.Group;
  private targetArcs: THREE.Mesh[] = [];
  private targetHalo!: THREE.Sprite;

  private crosshairGroup!: THREE.Group;
  private crosshairArcs: THREE.Mesh[] = [];
  private lockArc!: THREE.Line;
  private readinessArc!: THREE.Line;
  private muzzleFlash!: THREE.Sprite;

  private beam!: THREE.Mesh;

  private particleGeometry!: THREE.BufferGeometry;
  private particlePositions!: Float32Array;
  private particleColors!: Float32Array;
  private particleSizes!: Float32Array;

  private spotSprites: THREE.Sprite[] = [];

  private flashPlane!: THREE.Mesh;

  private irisTexture: THREE.CanvasTexture;
  private scleraTexture: THREE.CanvasTexture;
  private glowTexture: THREE.CanvasTexture;

  private disposables: Array<{ dispose: () => void }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setClearColor(0x03050a, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    const fovRad = 2 * Math.atan(ARENA_HEIGHT / 2 / CAMERA_DISTANCE);
    this.camera = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(fovRad), ARENA_ASPECT, 10, 4000);
    this.camera.position.copy(this.cameraBase);
    this.camera.lookAt(0, 0, 0);

    // Bloom sells the corneal highlight, the muzzle flash and the treatment
    // flashes as light rather than flat shapes — cheap for a scene this small.
    const initialSize = new THREE.Vector2(
      canvas.clientWidth || ARENA_WIDTH,
      canvas.clientHeight || ARENA_HEIGHT,
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(initialSize, 0.55, 0.6, 0.72);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.irisTexture = buildIrisTexture();
    this.scleraTexture = buildScleraTexture();
    this.glowTexture = buildGlowTexture();
    this.disposables.push(this.irisTexture, this.scleraTexture, this.glowTexture);

    this.buildLights();
    this.buildEye();
    this.buildTreatmentZone();
    this.buildTarget();
    this.buildCrosshair();
    this.buildBeam();
    this.buildParticles();
    this.buildSpots();
    this.buildFlashPlane();
  }

  // --------------------------------------------------------------- building

  private track<T extends THREE.Object3D>(obj: T): T {
    this.scene.add(obj);
    return obj;
  }

  private buildLights(): void {
    const ambient = new THREE.AmbientLight(0x8fb0c8, 0.55);
    const key = new THREE.DirectionalLight(0xfff4e0, 1.1);
    key.position.set(-220, 260, 520);
    const rim = new THREE.PointLight(0x34d399, 0.6, 1400);
    rim.position.set(340, -120, 260);
    this.scene.add(ambient, key, rim);
  }

  private buildEye(): void {
    // Sclera — full sphere; only the portion inside the eyelid aperture shows.
    const eyeGeo = new THREE.SphereGeometry(EYEBALL_RADIUS, 48, 32);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      map: this.scleraTexture,
      roughness: 0.42,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
    });
    this.eyeball = this.track(new THREE.Mesh(eyeGeo, eyeMat));
    this.eyeball.position.set(0, 0, EYEBALL_CENTER_Z);
    this.disposables.push(eyeGeo, eyeMat);

    // Iris.
    const irisGeo = new THREE.CircleGeometry(IRIS_RADIUS, 64);
    const irisMat = new THREE.MeshStandardMaterial({ map: this.irisTexture, roughness: 0.5 });
    this.iris = this.track(new THREE.Mesh(irisGeo, irisMat));
    this.iris.position.set(0, 0, IRIS_Z);
    this.disposables.push(irisGeo, irisMat);

    // Limbus — dark ring marking the iris/sclera boundary.
    const limbusGeo = new THREE.RingGeometry(IRIS_RADIUS - 2, IRIS_RADIUS + 10, 64);
    const limbusMat = new THREE.MeshBasicMaterial({
      color: PALETTE.limbus,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    this.limbus = this.track(new THREE.Mesh(limbusGeo, limbusMat));
    this.limbus.position.set(0, 0, IRIS_Z + 1);
    this.disposables.push(limbusGeo, limbusMat);

    // Pupil.
    const pupilGeo = new THREE.CircleGeometry(1, 48);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020608 });
    this.pupil = this.track(new THREE.Mesh(pupilGeo, pupilMat));
    this.pupil.position.set(0, 0, IRIS_Z + 2);
    this.disposables.push(pupilGeo, pupilMat);

    // Cornea — a thin, mostly-transparent glossy shell bulging out over the
    // iris. Shallow cap + low opacity so it reads as glass, not a milky lid.
    const corneaGeo = new THREE.SphereGeometry(CORNEA_DOME_RADIUS, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.24);
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: 0xe4f6ff,
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.cornea = this.track(new THREE.Mesh(corneaGeo, corneaMat));
    // The cap is built around the sphere's +Y pole; rotating +90° about X
    // swings that pole to face +Z (toward the camera).
    this.cornea.rotation.x = Math.PI / 2;
    this.cornea.position.set(0, 0, CORNEA_APEX_Z - CORNEA_DOME_RADIUS);
    this.disposables.push(corneaGeo, corneaMat);

    // Caruncle — small anatomical detail at the inner corner.
    const caruncleGeo = new THREE.SphereGeometry(13, 16, 12);
    const caruncleMat = new THREE.MeshStandardMaterial({ color: PALETTE.caruncle, roughness: 0.6 });
    this.caruncle = this.track(new THREE.Mesh(caruncleGeo, caruncleMat));
    this.caruncle.position.set(-360, 0, CORNEA_APEX_Z - 90);
    this.caruncle.scale.set(1, 0.7, 0.6);
    this.disposables.push(caruncleGeo, caruncleMat);

    // Eyelid mask: an extruded plate with an almond-shaped hole, matching the
    // original 2D eye silhouette. Everything outside the hole is hidden.
    const eyeShape = new THREE.Shape();
    eyeShape.moveTo(-380, 0);
    eyeShape.quadraticCurveTo(0, 340, 380, 0);
    eyeShape.quadraticCurveTo(0, -340, -380, 0);
    eyeShape.closePath();

    const plate = new THREE.Shape();
    const pw = ARENA_WIDTH;
    const ph = ARENA_HEIGHT;
    plate.moveTo(-pw / 2, -ph / 2);
    plate.lineTo(pw / 2, -ph / 2);
    plate.lineTo(pw / 2, ph / 2);
    plate.lineTo(-pw / 2, ph / 2);
    plate.closePath();
    plate.holes.push(eyeShape);

    const plateGeo = new THREE.ExtrudeGeometry(plate, { depth: 26, bevelEnabled: false });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x081018, roughness: 0.7, metalness: 0.1 });
    const lidPlate = this.track(new THREE.Mesh(plateGeo, plateMat));
    lidPlate.position.z = CORNEA_APEX_Z + 6;
    this.disposables.push(plateGeo, plateMat);

    // Glowing rim tracing the aperture edge.
    const rimPoints = eyeShape.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
    const rimMat = new THREE.LineBasicMaterial({ color: PALETTE.lidRim, transparent: true, opacity: 0.4 });
    this.lidRimOuter = this.track(new THREE.LineLoop(rimGeo, rimMat));
    this.lidRimOuter.position.z = CORNEA_APEX_Z + 33;
    this.disposables.push(rimGeo, rimMat);
  }

  private buildTreatmentZone(): void {
    this.zoneRingOuter = this.track(makeDashedCircle(178, 0x5ff2c0, 0.42, 16));
    this.zoneRingOuter.position.z = HUD_LAYER_Z - 6;
    this.zoneRingInner = this.track(makeDashedCircle(152, 0x5ff2c0, 0.25, 6));
    this.zoneRingInner.position.z = HUD_LAYER_Z - 6;
  }

  private buildTarget(): void {
    this.targetGroup = this.track(new THREE.Group());
    this.targetGroup.position.z = HUD_LAYER_Z;

    const arcMat = () =>
      new THREE.MeshBasicMaterial({ color: PALETTE.target, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i += 1) {
      const geo = new THREE.TorusGeometry(20, 1.6, 6, 16, 0.8);
      const mesh = new THREE.Mesh(geo, arcMat());
      mesh.rotation.z = (i / 3) * Math.PI * 2;
      this.targetArcs.push(mesh);
      this.targetGroup.add(mesh);
      this.disposables.push(geo, mesh.material as THREE.Material);
    }

    const dotGeo = new THREE.CircleGeometry(5, 20);
    const dotMat = new THREE.MeshBasicMaterial({ color: PALETTE.target });
    this.targetGroup.add(new THREE.Mesh(dotGeo, dotMat));
    this.disposables.push(dotGeo, dotMat);

    const haloMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: PALETTE.target,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.targetHalo = new THREE.Sprite(haloMat);
    this.targetHalo.scale.set(120, 120, 1);
    this.targetGroup.add(this.targetHalo);
    this.disposables.push(haloMat);
  }

  private buildCrosshair(): void {
    this.crosshairGroup = this.track(new THREE.Group());
    this.crosshairGroup.position.z = HUD_LAYER_Z + 4;

    const arcMat = () =>
      new THREE.MeshBasicMaterial({ color: PALETTE.idle, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i += 1) {
      const geo = new THREE.TorusGeometry(26, 1.4, 6, 12, 0.42);
      const mesh = new THREE.Mesh(geo, arcMat());
      mesh.rotation.z = (i / 4) * Math.PI * 2;
      this.crosshairArcs.push(mesh);
      this.crosshairGroup.add(mesh);
      this.disposables.push(geo, mesh.material as THREE.Material);
    }

    this.lockArc = makeSweepLine(34, PALETTE.perfect, 0.9);
    this.crosshairGroup.add(this.lockArc);
    this.readinessArc = makeSweepLine(41, 0xffffff, 0.28);
    this.crosshairGroup.add(this.readinessArc);

    const dotGeo = new THREE.CircleGeometry(2.6, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: PALETTE.idle });
    this.crosshairGroup.add(new THREE.Mesh(dotGeo, dotMat));
    this.disposables.push(dotGeo, dotMat);

    const flashMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0xb8ffd9,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.muzzleFlash = new THREE.Sprite(flashMat);
    this.muzzleFlash.scale.set(90, 90, 1);
    this.crosshairGroup.add(this.muzzleFlash);
    this.disposables.push(flashMat);
  }

  private buildBeam(): void {
    const geo = new THREE.CylinderGeometry(1, 4, 1, 8, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x7cf7b8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.beam = this.track(new THREE.Mesh(geo, mat));
    this.disposables.push(geo, mat);
  }

  private buildParticles(): void {
    this.particlePositions = new Float32Array(MAX_PARTICLES * 3);
    this.particleColors = new Float32Array(MAX_PARTICLES * 3);
    this.particleSizes = new Float32Array(MAX_PARTICLES);
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));

    const material = new THREE.PointsMaterial({
      size: 10,
      map: this.glowTexture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.track(new THREE.Points(this.particleGeometry, material));
    this.disposables.push(this.particleGeometry, material);
  }

  private buildSpots(): void {
    const mat = () =>
      new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: 0x7cf7b8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    for (let i = 0; i < MAX_SPOTS; i += 1) {
      const sprite = new THREE.Sprite(mat());
      sprite.visible = false;
      this.spotSprites.push(sprite);
      this.track(sprite);
      this.disposables.push(sprite.material);
    }
  }

  private buildFlashPlane(): void {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc8ffdf,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    this.flashPlane = new THREE.Mesh(geo, mat);
    this.flashPlane.position.set(0, 0, -1);
    this.flashPlane.renderOrder = 999;
    this.camera.add(this.flashPlane);
    this.scene.add(this.camera);
    this.disposables.push(geo, mat);
  }

  // ---------------------------------------------------------------- frame

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
  }

  render(rs: RenderState): void {
    this.updateEye(rs);
    this.updateTreatmentZone(rs);

    const showSurgeryHud = rs.state === 'STAGE';
    this.targetGroup.visible = showSurgeryHud;
    this.crosshairGroup.visible = showSurgeryHud;
    this.beam.visible = showSurgeryHud;
    if (showSurgeryHud) {
      this.updateTarget(rs);
      this.updateCrosshair(rs);
      this.updateBeam(rs);
    }

    this.updateParticles(rs);
    this.updateSpots(rs);
    this.updateFlashAndShake(rs);

    this.composer.render();
  }

  private updateEye(rs: RenderState): void {
    const breathing = 1 + Math.sin(rs.time * 1.1) * 0.05;
    const lockShrink = 1 - rs.lock * 0.18;
    const radius = PUPIL_RADIUS_BASE * breathing * lockShrink;
    this.pupil.scale.set(radius, radius, 1);

    this.eyeball.rotation.y = Math.sin(rs.time * 0.05) * 0.02;
  }

  private updateTreatmentZone(rs: RenderState): void {
    this.zoneRingOuter.rotation.z = rs.time * 0.22;
    this.zoneRingInner.rotation.z = -rs.time * 0.38;
  }

  private worldForGameplayPoint(x: number, y: number): THREE.Vector3 {
    return arenaToWorld(x, y, HUD_LAYER_Z);
  }

  private updateTarget(rs: RenderState): void {
    const p = this.worldForGameplayPoint(rs.target.x, rs.target.y);
    this.targetGroup.position.x = p.x;
    this.targetGroup.position.y = p.y;

    const near = rs.distance <= rs.radii.acceptable;
    const locked = rs.distance <= rs.radii.excellent;
    const color = locked ? PALETTE.perfect : near ? PALETTE.aligned : PALETTE.target;
    const pulse = 1 + Math.sin(rs.time * 4) * 0.06;

    this.targetGroup.rotation.z = rs.time * 0.9;
    for (const arc of this.targetArcs) {
      (arc.material as THREE.MeshBasicMaterial).color.setHex(color);
      arc.scale.setScalar(pulse);
    }
    (this.targetHalo.material as THREE.SpriteMaterial).color.setHex(locked ? PALETTE.perfect : PALETTE.target);
    this.targetHalo.material.opacity = locked ? 0.6 : near ? 0.45 : 0.35;
  }

  private updateCrosshair(rs: RenderState): void {
    const p = this.worldForGameplayPoint(rs.laser.x, rs.laser.y);
    this.crosshairGroup.position.x = p.x;
    this.crosshairGroup.position.y = p.y;

    const near = rs.distance <= rs.radii.acceptable;
    const locked = rs.distance <= rs.radii.excellent;
    const color = locked ? PALETTE.perfect : near ? PALETTE.aligned : PALETTE.idle;
    const kick = rs.recoil * 8;

    this.crosshairGroup.rotation.z = rs.time * (near ? 1.8 : 0.55);
    for (const arc of this.crosshairArcs) {
      (arc.material as THREE.MeshBasicMaterial).color.setHex(color);
      arc.scale.setScalar(1 + kick / 26);
    }

    setSweep(this.lockArc, rs.lock);
    (this.lockArc.material as THREE.LineBasicMaterial).opacity = rs.lock > 0.02 ? 0.9 : 0;

    setSweep(this.readinessArc, rs.readiness);
    (this.readinessArc.material as THREE.LineBasicMaterial).opacity = rs.readiness < 1 ? 0.28 : 0;

    (this.muzzleFlash.material as THREE.SpriteMaterial).opacity = rs.recoil * 0.6;
    this.muzzleFlash.scale.setScalar(70 + rs.recoil * 40);
  }

  private updateBeam(rs: RenderState): void {
    const emitter = arenaToWorld(ARENA_WIDTH / 2, -60, HUD_LAYER_Z + 400);
    const end = this.worldForGameplayPoint(rs.laser.x, rs.laser.y);
    const mid = emitter.clone().add(end).multiplyScalar(0.5);
    const length = emitter.distanceTo(end);
    const intensity = 0.08 + rs.recoil * 0.5;

    this.beam.position.copy(mid);
    this.beam.scale.set(1 + rs.recoil * 2.5, length, 1 + rs.recoil * 2.5);
    this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(emitter).normalize());
    (this.beam.material as THREE.MeshBasicMaterial).opacity = intensity;
  }

  private updateParticles(rs: RenderState): void {
    const particles = rs.effects.particles;
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const idx = i * 3;
      if (i < particles.length) {
        const p = particles[i];
        const world = this.worldForGameplayPoint(p.x, p.y);
        const t = p.life / p.maxLife;
        const c = new THREE.Color().setHSL((p.hue % 360) / 360, 0.85, 0.5 + t * 0.25);
        this.particlePositions[idx] = world.x;
        this.particlePositions[idx + 1] = world.y;
        this.particlePositions[idx + 2] = world.z;
        this.particleColors[idx] = c.r;
        this.particleColors[idx + 1] = c.g;
        this.particleColors[idx + 2] = c.b;
        this.particleSizes[i] = p.size * 6 * t;
      } else {
        this.particlePositions[idx + 2] = -100000;
        this.particleSizes[i] = 0;
      }
    }
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
  }

  private updateSpots(rs: RenderState): void {
    const spots = rs.spots;
    for (let i = 0; i < MAX_SPOTS; i += 1) {
      const sprite = this.spotSprites[i];
      if (i < spots.length) {
        const spot = spots[spots.length - 1 - i];
        const world = this.worldForGameplayPoint(spot.x, spot.y);
        const pop = Math.min(1, spot.age / 0.35);
        sprite.position.copy(world);
        sprite.scale.setScalar(24 + (1 - pop) * 46);
        const mat = sprite.material as THREE.SpriteMaterial;
        mat.opacity = 0.25 + (1 - pop) * 0.5;
        mat.color.setHex(spot.grade === 'EXCELLENT' ? PALETTE.perfect : PALETTE.aligned);
        sprite.visible = true;
      } else {
        sprite.visible = false;
      }
    }
  }

  private updateFlashAndShake(rs: RenderState): void {
    const mat = this.flashPlane.material as THREE.MeshBasicMaterial;
    mat.opacity = rs.effects.flash * 0.3;

    const shake = rs.effects.shake;
    this.camera.position.set(
      this.cameraBase.x + (shake > 0.1 ? (Math.random() - 0.5) * shake : 0),
      this.cameraBase.y + (shake > 0.1 ? (Math.random() - 0.5) * shake : 0),
      this.cameraBase.z,
    );
    this.camera.lookAt(0, 0, 0);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
