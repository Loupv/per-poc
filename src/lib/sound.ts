// Micro-sons synthétisés (WebAudio, zéro asset) + haptique.
// Désactivables — le réglage est conservé sur l'appareil.

const KEY = "per-poc-sound";

export const soundEnabled = () => localStorage.getItem(KEY) !== "off";
export const setSoundEnabled = (on: boolean) => localStorage.setItem(KEY, on ? "on" : "off");

let ctx: AudioContext | null = null;
const audio = (): AudioContext | null => {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

function note(freq: number, at: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + dur + 0.02);
}

export function playCorrect() {
  if (!soundEnabled()) return;
  note(660, 0, 0.1);
  note(880, 0.09, 0.14);
}

export function playWrong() {
  if (!soundEnabled()) return;
  note(196, 0, 0.18, "triangle", 0.1);
}

export function playEnd() {
  if (!soundEnabled()) return;
  note(523, 0, 0.12);
  note(659, 0.12, 0.12);
  note(784, 0.24, 0.22);
}

export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* pas de haptique disponible */
  }
}
