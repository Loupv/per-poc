// Nombres en toutes lettres, usage genevois : septante, nonante (mais quatre-vingts).
// Couvre 0 à 9'999 — sert uniquement aux énoncés générés.

const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];

const TENS: Record<number, string> = {
  20: "vingt", 30: "trente", 40: "quarante", 50: "cinquante",
  60: "soixante", 70: "septante", 90: "nonante",
};

function under100(n: number): string {
  if (n < 20) return UNITS[n];
  if (n >= 80 && n < 90) {
    if (n === 80) return "quatre-vingts";
    return "quatre-vingt-" + UNITS[n - 80];
  }
  const t = Math.floor(n / 10) * 10;
  const u = n - t;
  if (u === 0) return TENS[t];
  if (u === 1) return TENS[t] + " et un";
  return TENS[t] + "-" + UNITS[u];
}

function under1000(n: number): string {
  if (n < 100) return under100(n);
  const c = Math.floor(n / 100);
  const rest = n % 100;
  const cent = c === 1 ? "cent" : UNITS[c] + " cent" + (rest === 0 ? "s" : "");
  return rest === 0 ? cent : cent + " " + under100(rest);
}

export function toWords(n: number): string {
  if (n < 0 || n > 9999 || !Number.isInteger(n)) throw new Error(`hors plage: ${n}`);
  if (n < 1000) return under1000(n);
  const m = Math.floor(n / 1000);
  const rest = n % 1000;
  const mille = m === 1 ? "mille" : UNITS[m] + " mille";
  return rest === 0 ? mille : mille + " " + under1000(rest);
}

/** Format suisse avec apostrophe : 4072 -> "4'072". */
export const fmt = (n: number): string =>
  n < 1000 ? String(n) : `${Math.floor(n / 1000)}'${String(n % 1000).padStart(3, "0")}`;
