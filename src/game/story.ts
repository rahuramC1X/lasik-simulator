/**
 * The comic script wrapping each level — who shows up, what they say,
 * before and after the mechanic runs. Pure data; presentation lives in
 * components/comic/ComicStrip.tsx.
 */

import type { CharacterId } from './characters';
import type { OraMood } from '../components/characters/Avatars';

export interface ComicLine {
  characterId: CharacterId;
  text: string;
  /** Only meaningful when characterId is 'ora' — drives her iris colour. */
  mood?: OraMood;
}

export interface LevelStory {
  /** The hero this level is mainly about — drives the Level Select card art. */
  character: CharacterId;
  intro: readonly ComicLine[];
  outro: readonly ComicLine[];
}

const line = (characterId: CharacterId, text: string, mood?: OraMood): ComicLine => ({ characterId, text, mood });

export const LEVEL_STORY: Record<number, LevelStory> = {
  1: {
    character: 'ora',
    intro: [
      line('ora', "Oh good, you're awake. The Lab needs a new Vision Apprentice."),
      line('ora', "First things first — let's learn how an eye actually works."),
    ],
    outro: [line('ora', 'Not bad. You just learned more eye anatomy than most people ever do.', 'excited')],
  },
  2: {
    character: 'dexter',
    intro: [
      line('dexter', "HELP! I can't see the castle anymore!"),
      line('ora', "That's usually not how patients make an appointment.", 'confused'),
      line('dexter', "I'm serious! Everything's a blur!"),
    ],
    outro: [
      line('dexter', 'THERE IT IS! I can see the castle again!'),
      line('ora', "You've been attacking a mountain for three days, by the way.", 'excited'),
    ],
  },
  3: {
    character: 'dexter',
    intro: [
      line('ora', "Before we fix this properly, you need to understand what we're reshaping.", 'happy'),
      line('dexter', 'Just make the blur go away!'),
      line('ora', '...We\'re getting there.', 'confused'),
    ],
    outro: [line('ora', 'Good. Now you actually know what the laser is about to do.', 'happy')],
  },
  4: {
    character: 'dexter',
    intro: [
      line('dexter', "Okay. I'm ready. Do the thing."),
      line('ora', 'Ten clean pulses. No pressure.', 'suspicious'),
      line('dexter', 'That is EXTREMELY pressure.'),
    ],
    outro: [line('dexter', 'I CAN SEE EVERY BRICK IN THAT CASTLE!')],
  },
  5: {
    character: 'dexter',
    intro: [
      line('dexter', 'The castle guards say my eyes are STILL a little off.'),
      line('ora', "Let's tighten things up. Smaller margin this time."),
    ],
    outro: [line('dexter', "Perfect. Now I can see them not inviting me in.")],
  },
  6: {
    character: 'comet',
    intro: [
      line('comet', 'Captain Comet requesting emergency vision support!'),
      line('ora', '...he still does the radio voice.', 'confused'),
      line('comet', 'I keep losing track of the asteroids!'),
    ],
    outro: [line('comet', 'Tracking locked! Not a single asteroid gets past me now.')],
  },
  7: {
    character: 'luna',
    intro: [
      line('luna', 'My spell circles look... stretched. Squished. Wrong.'),
      line('ora', "That's not a curse. That's astigmatism.", 'happy'),
      line('luna', 'I liked it better when it was a curse.'),
    ],
    outro: [line('luna', 'The circle is round again! My spells are going to be so much cleaner.')],
  },
  8: {
    character: 'luna',
    intro: [
      line('luna', "One more thing — can you fix the actual blur too, not just the stretch?"),
      line('ora', 'Axis first. It decides how forgiving the rest will be.', 'happy'),
    ],
    outro: [line('luna', "Perfectly round and perfectly sharp. You're better at this than my old wand.")],
  },
  9: {
    character: 'comet',
    intro: [
      line('comet', 'Meteor shower in thirty seconds! No time for a slow appointment!'),
      line('ora', 'Try to still be precise. Just... faster.', 'suspicious'),
    ],
    outro: [line('comet', 'Made it with time to spare! Vision Heroes never miss!')],
  },
  10: {
    character: 'comet',
    intro: [
      line('dexter', 'Wait, is this the big one?'),
      line('luna', 'Tight tolerance, fast target, AND a countdown?'),
      line('comet', 'Captain Comet accepts this challenge on behalf of everyone.'),
      line('ora', "None of you are doing this. You're all here to watch.", 'suspicious'),
    ],
    outro: [
      line('ora', '...Okay. That was actually impressive.', 'excited'),
      line('dexter', 'VISION HERO!'),
      line('luna', 'VISION HERO!'),
      line('comet', 'VISION HERO!'),
    ],
  },
  0: {
    character: 'ora',
    intro: [
      line('ora', 'Your last few procedures were a little rough. No judgment.', 'confused'),
      line('ora', 'Well — a little judgment. Let\'s just practice. No case, no pressure.', 'suspicious'),
    ],
    outro: [line('ora', 'See? Steadier already. Back to the real cases.', 'excited')],
  },
};

export function getLevelStory(levelId: number): LevelStory | undefined {
  return LEVEL_STORY[levelId];
}
