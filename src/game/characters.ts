/**
 * The Vision Heroes — an original cast (deliberately not existing IP; see
 * README for why). Pure data: names, roles, and the theme colour their
 * comic panels and speech bubbles use. Avatar art lives in
 * src/components/characters/Avatars.tsx.
 */

export type CharacterId = 'ora' | 'dexter' | 'luna' | 'comet';

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  /** Primary theme colour for this character's speech bubbles and accents. */
  color: string;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  ora: { id: 'ora', name: 'ORA', role: 'Lab Guide', color: '#34d399' },
  dexter: { id: 'dexter', name: 'Dexter', role: 'Dragon Knight', color: '#22c55e' },
  luna: { id: 'luna', name: 'Luna', role: 'Rabbit Magician', color: '#c084fc' },
  comet: { id: 'comet', name: 'Captain Comet', role: 'Space Hero', color: '#38bdf8' },
};
