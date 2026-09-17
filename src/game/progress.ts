/**
 * Per-level completion record, localStorage-backed. Separate from
 * curriculum.ts's concept-unlock store — this one drives which levels are
 * selectable on the Level Select screen.
 */

const STORAGE_KEY = 'lasik-sim:completed-levels';

function readStore(): Set<number> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is number => typeof v === 'number')) : new Set();
  } catch {
    return new Set();
  }
}

function writeStore(ids: Set<number>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Private-browsing or storage-disabled — progress just won't persist.
  }
}

export function getCompletedLevelIds(): Set<number> {
  return readStore();
}

export function markLevelComplete(id: number): void {
  const store = readStore();
  if (store.has(id)) return;
  store.add(id);
  writeStore(store);
}

/** Level 1 is always open; level N otherwise needs N-1 completed. */
export function isLevelUnlocked(id: number, completed: ReadonlySet<number>): boolean {
  return id === 1 || completed.has(id - 1);
}
