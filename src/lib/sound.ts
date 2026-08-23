import { loadSound } from "@/lib/preferences";

/**
 * Tiny WebAudio synth for UI sounds. No audio files: tones are generated
 * with an oscillator and a short gain envelope. Off by default.
 */
type Note = {
  /** Frequency in hertz. */
  freq: number;
  /** Duration in milliseconds. */
  ms: number;
  /** Delay before the note starts, in milliseconds. */
  at?: number;
  gain?: number;
};

const RECIPES: Record<"tap" | "success" | "error" | "toggle", Note[]> = {
  tap: [{ freq: 660, ms: 40, gain: 0.04 }],
  toggle: [
    { freq: 520, ms: 35, gain: 0.04 },
    { freq: 700, ms: 45, at: 30, gain: 0.05 },
  ],
  success: [
    { freq: 587, ms: 90, gain: 0.06 },
    { freq: 880, ms: 140, at: 80, gain: 0.07 },
  ],
  error: [
    { freq: 320, ms: 120, gain: 0.07 },
    { freq: 240, ms: 160, at: 100, gain: 0.07 },
  ],
};

let ctx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  if (!ctx || ctx.state === "closed") {
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function play(notes: Note[]): boolean {
  if (!loadSound()) {
    return false;
  }
  const audio = ensureContext();
  if (!audio) {
    return false;
  }
  const now = audio.currentTime;
  for (const note of notes) {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const start = now + (note.at ?? 0) / 1000;
    const end = start + note.ms / 1000;
    const peak = note.gain ?? 0.05;
    osc.type = "sine";
    osc.frequency.value = note.freq;
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(peak, start + 8 / 1000);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(amp).connect(audio.destination);
    osc.start(start);
    osc.stop(end + 20 / 1000);
  }
  return true;
}

export function sound(name: keyof typeof RECIPES): boolean {
  return play(RECIPES[name]);
}
