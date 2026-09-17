/**
 * Adaptive difficulty: a rolling record of recent precision-stage
 * performance, localStorage-backed. When it stays weak, the engine offers a
 * short, low-pressure "Precision Training" drill instead of just letting
 * the player grind against the curriculum at the same difficulty.
 */

const STORAGE_KEY = 'lasik-sim:precision-history';
const HISTORY_SIZE = 3;
const MIN_SAMPLES = 2;
// A completed level's precision score can't actually fall below 60 — that's
// the accuracy floor of the "acceptable" grade tier (see scoring.ts). A
// player mostly landing acceptable-not-good hits already sits at ~60-67, so
// the threshold has to be above the floor to ever trigger on real play.
const WEAK_THRESHOLD = 68;

function readHistory(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

function writeHistory(history: readonly number[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Private-browsing or storage-disabled — the game just won't adapt.
  }
}

/** Records one precision-stage result (0-100). Keeps only the most recent few. */
export function recordPrecisionAttempt(precision: number): void {
  const history = readHistory();
  history.push(precision);
  while (history.length > HISTORY_SIZE) history.shift();
  writeHistory(history);
}

/** True once recent precision attempts have averaged below the weak threshold. */
export function needsPrecisionTraining(): boolean {
  const history = readHistory();
  if (history.length < MIN_SAMPLES) return false;
  const avg = history.reduce((sum, v) => sum + v, 0) / history.length;
  return avg < WEAK_THRESHOLD;
}

/** Clears the streak — called after a training drill, so it doesn't loop immediately. */
export function resetPrecisionHistory(): void {
  writeHistory([]);
}
