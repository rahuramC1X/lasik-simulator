/**
 * Minimal WebAudio placeholder cues — synthesised, no asset files.
 * The context is created lazily on the first user gesture so browsers don't
 * block it, and every call is a no-op if audio is unavailable or muted.
 */

type Cue = 'excellent' | 'good' | 'acceptable' | 'miss' | 'complete';

interface CueSpec {
  freq: number;
  endFreq: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const CUES: Record<Cue, CueSpec> = {
  excellent: { freq: 880, endFreq: 1320, duration: 0.18, type: 'triangle', gain: 0.14 },
  good: { freq: 660, endFreq: 880, duration: 0.14, type: 'triangle', gain: 0.11 },
  acceptable: { freq: 440, endFreq: 520, duration: 0.12, type: 'sine', gain: 0.1 },
  miss: { freq: 190, endFreq: 96, duration: 0.24, type: 'sawtooth', gain: 0.09 },
  complete: { freq: 523, endFreq: 1046, duration: 0.55, type: 'triangle', gain: 0.16 },
};

let ctx: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function play(cue: Cue): void {
  if (muted) return;
  const audio = context();
  if (!audio) return;

  const spec = CUES[cue];
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, now);
  osc.frequency.exponentialRampToValueAtTime(spec.endFreq, now + spec.duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(spec.gain, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + spec.duration + 0.02);
}
