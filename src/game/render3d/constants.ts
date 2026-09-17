/**
 * Shared 3D-space constants. The gameplay plane (z = 0) maps 1:1 to arena
 * pixel units, so engine code never needs to know a renderer is 3D.
 */

import * as THREE from 'three';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  EYE_CENTER,
  IRIS_RADIUS,
  PUPIL_RADIUS,
} from '../types';

export const ARENA_ASPECT = ARENA_WIDTH / ARENA_HEIGHT;

/** Converts an arena-space point (origin top-left, y-down) into world space
 * (origin at eye centre, y-up). Optional z lets an object sit "above" the
 * gameplay plane, e.g. resting on the corneal bulge. */
export function arenaToWorld(x: number, y: number, z = 0): THREE.Vector3 {
  return new THREE.Vector3(x - EYE_CENTER.x, -(y - EYE_CENTER.y), z);
}

/**
 * Eyeball geometry, in the same units as arena pixels. Layers stack strictly
 * outward from the sclera surface so nothing gets hidden behind it:
 *   sclera apex < iris/pupil < cornea dome apex < floating HUD (target/crosshair)
 */
export const EYEBALL_RADIUS = 340;
export const EYEBALL_CENTER_Z = -70;
export { IRIS_RADIUS, PUPIL_RADIUS as PUPIL_RADIUS_BASE };

const SCLERA_APEX_Z = EYEBALL_CENTER_Z + EYEBALL_RADIUS;
export const IRIS_Z = SCLERA_APEX_Z + 4;
export const CORNEA_DOME_RADIUS = 190;
export const CORNEA_APEX_Z = SCLERA_APEX_Z + 36;

/** z a floating UI element (target/crosshair/spots) sits at, just off the cornea. */
export const HUD_LAYER_Z = CORNEA_APEX_Z + 40;

export const PALETTE = {
  aligned: 0x34d399,
  perfect: 0x86efac,
  idle: 0x7f8ea8,
  miss: 0xff6a5e,
  target: 0xffb347,
  limbus: 0x04141c,
  caruncle: 0xe6a5aa,
  lidRim: 0x8fe6b8,
} as const;
