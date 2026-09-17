/**
 * "Decode Your Eye" — the data behind the report-reading vertical slice
 * (src/components/prototypes/DecodeReportPrototype.tsx).
 *
 * The slice tests one question: can somebody who has never seen an
 * ophthalmology report learn to read three of its lines by manipulating the
 * eye those lines describe, instead of by reading paragraphs about them?
 *
 * Everything here is a SYNTHETIC case. It is not a template for interpreting
 * a real person's report, and nothing in this file decides whether anybody is
 * a candidate for anything. The numbers are internally consistent — the
 * corneal readings and the cylinder agree — so the teaching holds together;
 * a real eye is messier than that.
 *
 * Framework-independent, like the rest of src/game.
 */

export type ReportLineId = 'sph' | 'cyl' | 'axis';

export interface ReportLine {
  id: ReportLineId;
  /** How the line is printed on the report. */
  code: string;
  /** What the abbreviation stands for. */
  name: string;
  /** The printed value, including its unit. */
  display: string;
  /** The value the player's control has to land on, in that line's own units. */
  value: number;
  /** One plain sentence — what this line is, shown before any interaction. */
  summary: string;
  /** What the player does in this line's interactive panel. */
  task: string;
  /** The takeaway, revealed once the line is decoded. */
  takeaway: string;
}

export interface CornealReading {
  code: string;
  /** Curvature in dioptres. */
  power: number;
  /** The meridian this curvature was measured along, in degrees. */
  meridian: number;
  label: string;
}

export interface SyntheticReport {
  caseId: string;
  eye: string;
  lines: readonly ReportLine[];
  cornea: readonly CornealReading[];
}

/**
 * One fictional case, chosen to be legible rather than typical: enough
 * astigmatism that the axis visibly matters, and a with-the-rule orientation
 * (axis near 180°, steep meridian near 90°) so the topography bowtie reads
 * clearly.
 */
export const SYNTHETIC_REPORT: SyntheticReport = {
  caseId: 'SYN-001',
  eye: 'RIGHT EYE (OD)',
  lines: [
    {
      id: 'sph',
      code: 'SPH',
      name: 'Sphere',
      display: '-4.25 D',
      value: 4.25,
      summary: "How far off the eye's overall focusing power is — the largest single number here.",
      task: 'Drag the correction until the light lands on the retina, not in front of it.',
      takeaway:
        "-4.25 D is how much focusing power has to be taken away for light to land on the retina " +
        'instead of converging in front of it. The minus sign is what makes this myopia — short-sighted.',
    },
    {
      id: 'cyl',
      code: 'CYL',
      name: 'Cylinder',
      display: '-3.50 D',
      value: 3.5,
      summary: "How much of the blur is astigmatism — the part that isn't the same in every direction.",
      task: 'Even out the cornea until the curvature map stops showing a hot and a cold axis.',
      takeaway:
        "-3.50 D is the amount of astigmatism: the gap between the cornea's steepest and flattest " +
        'curves. It is why this blur is stretched in one direction rather than just soft all over.',
    },
    {
      id: 'axis',
      code: 'AXIS',
      name: 'Axis',
      display: '175°',
      value: 175,
      summary: 'Which way the astigmatism runs. A direction, not an amount — 1° to 180°.',
      task: 'Rotate the correction until the stretched blur rounds into a point.',
      takeaway:
        "175° is an orientation, not a strength — which is why it has no 'D' after it. Two eyes with " +
        'identical -3.50 D cylinder but different axes need corrections rotated differently.',
    },
  ],
  cornea: [
    { code: 'K1', power: 43.25, meridian: 175, label: 'flattest curve' },
    { code: 'K2', power: 46.75, meridian: 85, label: 'steepest curve' },
  ],
};

export function reportLine(id: ReportLineId): ReportLine {
  const line = SYNTHETIC_REPORT.lines.find((l) => l.id === id);
  if (!line) throw new Error(`unknown report line: ${id}`);
  return line;
}

/** The difference between the two corneal readings — the corneal share of the astigmatism. */
export const DELTA_K = Math.abs(SYNTHETIC_REPORT.cornea[1].power - SYNTHETIC_REPORT.cornea[0].power);

/**
 * Minus-cylinder convention: the printed axis names the *flatter* meridian,
 * so the cornea's steep meridian sits 90° away. It's the first genuinely
 * non-obvious thing in the report, and the topography panel shows it rather
 * than asserting it.
 */
export function steepMeridian(axisDeg: number): number {
  return (axisDeg + 90) % 180;
}

/** How close each control has to land to count as decoded, in that line's own units. */
export const DECODE_TOLERANCE: Record<ReportLineId, number> = {
  sph: 0.55,
  cyl: 0.45,
  axis: 9,
};

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: readonly QuizOption[];
  answerId: string;
  /** Shown after answering, right or wrong. */
  explain: string;
}

/**
 * Three questions, each one asking the player to *use* a line rather than
 * recall its definition. Answering wrong doesn't end anything — it costs
 * points and explains itself, because the slice is testing comprehension,
 * not punishing a first guess.
 */
export const QUIZ: readonly QuizQuestion[] = [
  {
    id: 'amount',
    prompt: 'Which line tells you how MUCH astigmatism this eye has?',
    options: [
      { id: 'sph', label: 'SPH  -4.25 D' },
      { id: 'cyl', label: 'CYL  -3.50 D' },
      { id: 'axis', label: 'AXIS  175°' },
    ],
    answerId: 'cyl',
    explain:
      'Cylinder is the amount of astigmatism. Sphere is the overall focusing error, and axis is a ' +
      'direction — neither of them tells you how much.',
  },
  {
    id: 'direction',
    prompt: 'Which line is a direction rather than an amount?',
    options: [
      { id: 'sph', label: 'SPH  -4.25 D' },
      { id: 'cyl', label: 'CYL  -3.50 D' },
      { id: 'axis', label: 'AXIS  175°' },
    ],
    answerId: 'axis',
    explain:
      'Axis is measured in degrees, not dioptres — that missing "D" is the giveaway. It says which ' +
      'way the astigmatism is lined up, and says nothing about its strength.',
  },
  {
    id: 'delta-k',
    prompt: 'The corneal readings are 43.25 D and 46.75 D. What is the 3.50 D gap between them?',
    options: [
      { id: 'thickness', label: 'How thick the cornea is' },
      { id: 'corneal-astig', label: "The cornea's share of the astigmatism" },
      { id: 'glasses', label: 'The strength of glasses needed' },
    ],
    answerId: 'corneal-astig',
    explain:
      "Those two readings are the cornea's flattest and steepest curves. The gap between them is " +
      'corneal astigmatism — here it lines up with the -3.50 D cylinder. In a real eye the lens ' +
      "contributes too, so the two numbers don't have to match exactly.",
  },
];

export const BADGE = {
  icon: '🔍',
  title: 'ASTIGMATISM DETECTIVE',
  blurb: 'You can now read the three lines that describe how an eye is out of focus.',
} as const;
