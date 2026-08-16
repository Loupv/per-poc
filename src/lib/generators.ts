// Questions génératives : des gabarits à valeurs aléatoires, calibrés 6P.
// Une étape équipée d'un générateur ne resservira jamais deux fois la même question.
// L'id de la question générée est celui du gabarit (stable) : le journal des fautes
// agrège ainsi par gabarit (« livrets ratés 3× »).

import type { Question } from "../types";
import { fmt, toWords } from "./frenchNumbers";
import { CHARACTERS, pick, universeOfToday } from "./universe";

const ri = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export interface Generator {
  id: string;
  stepId: number;
  make: () => Question;
}

const distinct = (make: () => number, n: number): number[] => {
  const out = new Set<number>();
  let guard = 0;
  while (out.size < n && guard++ < 200) out.add(make());
  return [...out];
};

export const GENERATORS: Generator[] = [
  {
    id: "g4955",
    stepId: 4955,
    make: () => {
      const a = ri(2, 9), b = ri(2, 9);
      return {
        id: "g4955", type: "input",
        prompt: `${a} × ${b} = ?`,
        accepted: [String(a * b)],
        explanation: `${a} × ${b} = ${a * b} — c'est le livret de ${Math.min(a, b)} !`,
      };
    },
  },
  {
    id: "g4954",
    stepId: 4954,
    make: () => {
      const a = ri(11, 19), b = ri(2, 9);
      return {
        id: "g4954", type: "input",
        prompt: `${a} − ${b} = ?`,
        accepted: [String(a - b)],
        explanation: `${a} − ${b} = ${a - b}. Astuce : passe par 10 (${a} − ${a - 10} = 10).`,
      };
    },
  },
  {
    id: "g4952a",
    stepId: 4952,
    make: () => {
      const a = ri(120, 780), b = ri(120, 990 - 120);
      return {
        id: "g4952a", type: "input",
        prompt: `Pose et calcule : ${a} + ${b} = ?`,
        accepted: [String(a + b), fmt(a + b)],
        explanation: `${a} + ${b} = ${fmt(a + b)}. Pense aux retenues !`,
      };
    },
  },
  {
    id: "g4952s",
    stepId: 4952,
    make: () => {
      const a = ri(300, 990), b = ri(110, a - 50);
      return {
        id: "g4952s", type: "input",
        prompt: `Pose et calcule : ${a} − ${b} = ?`,
        accepted: [String(a - b)],
        explanation: `${a} − ${b} = ${a - b}. Vérification : ${a - b} + ${b} = ${a}.`,
      };
    },
  },
  {
    id: "g4895",
    stepId: 4895,
    make: () => {
      const step = pick([10, 100, 1000]);
      const n = ri(2, 8) * (step === 1000 ? 1000 : step === 100 ? 100 : 10) + ri(0, 9) + (step > 10 ? ri(0, 9) * 10 : 0);
      const next = n + 2 * step;
      return {
        id: "g4895", type: "input",
        prompt: `Je compte de ${fmt(step)} en ${fmt(step)} : ${fmt(n)}, ${fmt(n + step)}, … ?`,
        accepted: [String(next), fmt(next)],
        explanation: `${fmt(n + step)} + ${fmt(step)} = ${fmt(next)}.`,
      };
    },
  },
  {
    id: "g4902",
    stepId: 4902,
    make: () => {
      const delta = pick([10, 100, 1000]);
      const bigger = Math.random() < 0.5;
      const n = ri(delta === 1000 ? 1200 : 200, 8800);
      const ans = bigger ? n + delta : n - delta;
      return {
        id: "g4902", type: "input",
        prompt: `Quel nombre est plus ${bigger ? "grand" : "petit"} de ${fmt(delta)} que ${fmt(n)} ?`,
        accepted: [String(ans), fmt(ans)],
        explanation: `${fmt(n)} ${bigger ? "+" : "−"} ${fmt(delta)} = ${fmt(ans)}.`,
      };
    },
  },
  {
    id: "g4898",
    stepId: 4898,
    make: () => {
      const nums = distinct(() => ri(80, 9900), 4).sort((a, b) => a - b);
      return {
        id: "g4898", type: "order",
        prompt: "Range ces nombres du plus petit au plus grand.",
        items: nums.map(fmt),
        explanation: `Du plus petit au plus grand : ${nums.map(fmt).join(" < ")}.`,
      };
    },
  },
  {
    id: "g4912",
    stepId: 4912,
    make: () => {
      const n = ri(1001, 9999);
      return {
        id: "g4912", type: "input",
        prompt: `Écris en chiffres : ${toWords(n)}`,
        accepted: [String(n), fmt(n), `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, "0")}`],
        explanation: `${toWords(n)} = ${fmt(n)}.`,
      };
    },
  },
  {
    id: "g4986",
    stepId: 4986,
    make: () => {
      const n = ri(2, 9);
      const toCm = Math.random() < 0.6;
      return toCm
        ? {
            id: "g4986", type: "input",
            prompt: `${n} m = ? cm`,
            accepted: [String(n * 100), `${n * 100} cm`, `${n * 100}cm`],
            explanation: `1 m = 100 cm, donc ${n} m = ${n * 100} cm.`,
          }
        : {
            id: "g4986", type: "input",
            prompt: `${n * 100} cm = ? m`,
            accepted: [String(n), `${n} m`, `${n}m`],
            explanation: `100 cm = 1 m, donc ${n * 100} cm = ${n} m.`,
          };
    },
  },
  {
    id: "g4904",
    stepId: 4904,
    make: () => {
      const n = ri(1100, 9899);
      const d = Math.floor(n / 10);
      const wrongs = new Set<number>([Math.floor(n / 100), n % 100, Math.floor(d / 10)]);
      wrongs.delete(d);
      const choices = [d, ...[...wrongs].slice(0, 3)].map(String);
      return {
        id: "g4904", type: "mcq",
        prompt: `Dans ${fmt(n)}, combien y a-t-il de dizaines EN TOUT ?`,
        choices,
        answerIndex: 0,
        explanation: `${fmt(n)} = ${d} dizaines et ${n % 10} unité${n % 10 > 1 ? "s" : ""}.`,
      };
    },
  },
  {
    id: "g4943",
    stepId: 4943,
    make: () => {
      const k = pick([2, 5, 10]);
      const goods = distinct(() => ri(2, 12) * k, 3);
      const bads = distinct(() => {
        const x = ri(11, 120);
        return x % k === 0 ? x + 1 : x;
      }, 2);
      const all = [...goods, ...bads].sort(() => Math.random() - 0.5);
      return {
        id: "g4943", type: "multi",
        prompt: `Coche tous les multiples de ${k}.`,
        choices: all.map(String),
        correctIndices: all.map((v, i) => (v % k === 0 ? i : -1)).filter((i) => i >= 0),
        explanation:
          k === 2
            ? "Les multiples de 2 (nombres pairs) finissent par 0, 2, 4, 6 ou 8."
            : k === 5
              ? "Les multiples de 5 finissent par 0 ou 5."
              : "Les multiples de 10 finissent par 0.",
      };
    },
  },
  {
    id: "gprob-add",
    stepId: 4937,
    make: () => {
      const u = universeOfToday();
      const who = pick(CHARACTERS);
      const obj = pick(u.objets);
      const isAdd = Math.random() < 0.5;
      const a = ri(25, 480), b = ri(15, isAdd ? 380 : Math.min(a - 5, 300));
      return {
        id: "gprob-add", type: "input",
        prompt: (isAdd ? u.add : u.sub)(who, a, b, obj),
        accepted: [String(isAdd ? a + b : a - b)],
        explanation: `${a} ${isAdd ? "+" : "−"} ${b} = ${isAdd ? a + b : a - b}.`,
      };
    },
  },
  {
    id: "gprob-mult",
    stepId: 4939,
    make: () => {
      const u = universeOfToday();
      const who = pick(CHARACTERS);
      const obj = pick(u.objets);
      const n = ri(3, 9), k = pick([5, 10, 12, 20, 25]);
      return {
        id: "gprob-mult", type: "input",
        prompt: u.mult(who, n, k, obj),
        accepted: [String(n * k)],
        explanation: `${n} × ${k} = ${n * k}.`,
      };
    },
  },
];

export const GENERATORS_BY_STEP = new Map<number, Generator[]>();
for (const g of GENERATORS) {
  const list = GENERATORS_BY_STEP.get(g.stepId) ?? [];
  list.push(g);
  GENERATORS_BY_STEP.set(g.stepId, list);
}

/** Questions rapides pour le mode éclair (livrets et compléments, en QCM). */
export function makeEclairQuestion(): Question {
  if (Math.random() < 0.6) {
    const a = ri(2, 9), b = ri(2, 9);
    const good = a * b;
    const wrongs = distinct(() => good + pick([-10, -6, -4, -2, 2, 4, 6, 10, a, -b]), 3).filter(
      (x) => x !== good && x > 0
    );
    const choices = [good, ...wrongs.slice(0, 3)].sort(() => Math.random() - 0.5);
    return {
      id: "geclair-x", type: "mcq",
      prompt: `${a} × ${b}`,
      choices: choices.map(String),
      answerIndex: choices.indexOf(good),
      explanation: `${a} × ${b} = ${good}`,
    };
  }
  const a = ri(11, 19), b = ri(2, 9);
  const good = a - b;
  const wrongs = distinct(() => good + pick([-2, -1, 1, 2, 3]), 3).filter((x) => x !== good && x > 0);
  const choices = [good, ...wrongs.slice(0, 3)].sort(() => Math.random() - 0.5);
  return {
    id: "geclair-s", type: "mcq",
    prompt: `${a} − ${b}`,
    choices: choices.map(String),
    answerIndex: choices.indexOf(good),
    explanation: `${a} − ${b} = ${good}`,
  };
}

/** Étape associée à une question éclair (pour l'historique d'entraînement). */
export const ECLAIR_STEP: Record<string, number> = { "geclair-x": 4955, "geclair-s": 4954 };
