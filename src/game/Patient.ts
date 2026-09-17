/**
 * Fictional patient model.
 *
 * These numbers are game parameters used to flavour a level and scale
 * difficulty. They are not a medical prescription and say nothing about
 * whether any real person is a candidate for any real procedure.
 */

export interface Patient {
  id: string;
  name: string;
  /** Fictional myopia value, in dioptres (negative). */
  myopia: number;
  /** Fictional astigmatism value, in dioptres (negative). */
  astigmatism: number;
  /** 0..1 — how demanding this patient is. Reserved for difficulty scaling. */
  targetPrecision: number;
  /** Short flavour line shown on the intro screen. */
  note: string;
}

const ROSTER: readonly Patient[] = [
  {
    id: '001',
    name: 'Alex',
    myopia: -3.5,
    astigmatism: -1.0,
    targetPrecision: 0.6,
    note: 'Wants to read the subway signs without squinting.',
  },
  {
    id: '002',
    name: 'Mira',
    myopia: -2.75,
    astigmatism: -0.5,
    targetPrecision: 0.62,
    note: 'Night driving has been getting harder every year.',
  },
  {
    id: '003',
    name: 'Jonas',
    myopia: -4.25,
    astigmatism: -1.25,
    targetPrecision: 0.65,
    note: 'Tired of losing contact lenses at the climbing gym.',
  },
  {
    id: '004',
    name: 'Ines',
    myopia: -1.75,
    astigmatism: -0.75,
    targetPrecision: 0.58,
    note: 'Hoping to see the stars properly on the next camping trip.',
  },
];

/** Picks a patient from the roster, avoiding an immediate repeat. */
export function pickPatient(previousId?: string): Patient {
  const pool = ROSTER.filter((p) => p.id !== previousId);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Formats a dioptre value the way the HUD and intro screen display it. */
export function formatDioptres(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)} D`;
}
