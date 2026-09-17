/**
 * The knowledge layer: what Level 1 teaches, and a tiny localStorage-backed
 * record of what the player has demonstrated so far. Pure data + storage
 * helpers — no engine or rendering concerns.
 */

/**
 * The eight structures "Meet the Eye" asks the player to find, in the order
 * light actually travels through the eye — cornea first, optic nerve last.
 * `EyeCrossSection` renders exactly these ids as clickable shapes.
 */
export const IDENTIFY_SEQUENCE = [
  'cornea',
  'pupil',
  'iris',
  'lens',
  'vitreous',
  'retina',
  'macula',
  'optic-nerve',
] as const;

export type StructureId = (typeof IDENTIFY_SEQUENCE)[number];

export interface Concept {
  id: string;
  title: string;
  /** Short label for the achievement screen's "skills unlocked" list. */
  skill: string;
  fact: string;
}

const STRUCTURE_CONCEPTS: readonly Concept[] = [
  {
    id: 'cornea',
    title: 'The Cornea',
    skill: 'Cornea identification',
    fact:
      "The cornea is the eye's clear, curved front window. It provides about two-thirds of " +
      "the eye's total focusing power — more than the lens does.",
  },
  {
    id: 'pupil',
    title: 'The Pupil',
    skill: 'Pupil identification',
    fact: "The pupil isn't a structure on its own — it's simply the opening at the centre of the iris where light enters the inside of the eye.",
  },
  {
    id: 'iris',
    title: 'The Iris',
    skill: 'Iris identification',
    fact: 'The iris is a ring of muscle that widens or narrows the pupil, controlling how much light gets through.',
  },
  {
    id: 'lens',
    title: 'The Lens',
    skill: 'Lens identification',
    fact:
      'The lens sits just behind the iris and fine-tunes focus by changing shape — it\'s what ' +
      'lets you shift focus between something far away and something close up.',
  },
  {
    id: 'vitreous',
    title: 'The Vitreous',
    skill: 'Vitreous identification',
    fact:
      'The vitreous is a clear, gel-like substance filling the large chamber behind the lens. ' +
      "It helps the eyeball hold its round shape.",
  },
  {
    id: 'retina',
    title: 'The Retina',
    skill: 'Retina identification',
    fact:
      'The retina lines the inside of the back of the eye. It holds the light-sensitive cells ' +
      'that convert focused light into the electrical signals your brain reads as an image.',
  },
  {
    id: 'macula',
    title: 'The Macula',
    skill: 'Macula identification',
    fact:
      'The macula is a small, densely packed spot at the centre of the retina, responsible for ' +
      "sharp, detailed central vision — it's what you're using to read this sentence.",
  },
  {
    id: 'optic-nerve',
    title: 'The Optic Nerve',
    skill: 'Optic nerve identification',
    fact: "The optic nerve carries the retina's signals back to the brain, where they're interpreted as images.",
  },
];

/** Every concept the first ten levels can unlock, in teaching order. */
export const ALL_CONCEPTS: readonly Concept[] = [
  ...STRUCTURE_CONCEPTS,
  {
    id: 'myopia',
    title: 'Why Myopia Blurs',
    skill: 'Refractive-error mechanics',
    fact:
      'In myopia the cornea and lens bend light a little too strongly for the length of the eye: ' +
      'light converges to a point in front of the retina instead of landing on it, so anything ' +
      'past that point arrives already out of focus.',
  },
  {
    id: 'corneal-layers',
    title: 'Inside the Cornea',
    skill: 'Corneal-layer anatomy',
    fact:
      'The cornea is built in layers. LASIK lifts a thin flap from the outer layers, reshapes the ' +
      'thicker layer underneath — the stroma — with a laser, then lays the flap back down. No ' +
      'stitches needed.',
  },
  {
    id: 'lasik-concept',
    title: 'How LASIK Works',
    skill: 'LASIK treatment concept',
    fact:
      "LASIK never touches the eye's natural lens. It reshapes the cornea's stroma so light bends " +
      'by just the right amount to converge precisely on the retina.',
  },
  {
    id: 'laser-alignment',
    title: 'Laser Alignment',
    skill: 'Laser alignment & precision',
    fact:
      'Real refractive lasers track eye position many times a second and only fire when precisely ' +
      'aligned — exactly what you just practiced.',
  },
  {
    id: 'tighter-tolerance',
    title: 'Tighter Alignment',
    skill: 'Sub-millimetre alignment',
    fact:
      'Real refractive treatments work within fractions of a millimetre. As the margin for error ' +
      'shrinks, the same steady hand has to become a steadier one.',
  },
  {
    id: 'target-tracking',
    title: 'Tracking a Moving Eye',
    skill: 'Dynamic eye tracking',
    fact:
      "Eyes drift and micro-move even when they feel still. Real lasers track that motion many " +
      'times a second and adjust — which is why speed matters as much as precision.',
  },
  {
    id: 'astigmatism-axis',
    title: "Astigmatism's Axis",
    skill: 'Axis identification',
    fact:
      "Astigmatism isn't just 'too strong' or 'too weak' — light focuses unevenly along a specific " +
      'axis, like a rugby-ball-shaped cornea instead of a basketball-shaped one. Correction has to ' +
      'match that axis, not just the amount.',
  },
  {
    id: 'astigmatism-correction',
    title: 'Combined Correction',
    skill: 'Axis + power correction',
    fact:
      'Correcting astigmatism means treating two things at once: how strongly the cornea bends ' +
      'light, and along which axis it bends unevenly. Get the axis wrong and the power correction ' +
      "can't land cleanly.",
  },
  {
    id: 'time-pressure',
    title: 'Working Under Time',
    skill: 'Time-pressured precision',
    fact:
      'Real procedures still have to be efficient — a patient can hold still, but not indefinitely, ' +
      'and a lengthy procedure carries its own risks.',
  },
  {
    id: 'mastery',
    title: 'Ten Procedures In',
    skill: 'Multi-parameter mastery',
    fact:
      "Balancing precision, speed, and safety all at once is what separates a rookie's first " +
      "attempt from someone who's done this ten times.",
  },
  {
    id: 'precision-training',
    title: 'Deliberate Practice',
    skill: 'Focused precision drilling',
    fact:
      'Consistency comes from repetition under low pressure, not from grinding through a case that ' +
      "keeps going wrong. A short, forgiving drill rebuilds the motor pattern before you return to the curriculum.",
  },
];

const STORAGE_KEY = 'lasik-sim:unlocked-concepts';

function readStore(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeStore(ids: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Private-browsing or storage-disabled — progress just won't persist.
  }
}

export function getUnlockedConceptIds(): Set<string> {
  return readStore();
}

/** Marks concepts unlocked, merging with whatever was already recorded. Returns the ones that are newly unlocked. */
export function unlockConcepts(ids: readonly string[]): string[] {
  const store = readStore();
  const fresh = ids.filter((id) => !store.has(id));
  fresh.forEach((id) => store.add(id));
  if (fresh.length > 0) writeStore(store);
  return fresh;
}

export function conceptById(id: string): Concept | undefined {
  return ALL_CONCEPTS.find((c) => c.id === id);
}
