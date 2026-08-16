// Audit du biais de longueur dans les QCM : si la bonne réponse est nettement
// plus longue/détaillée que les distracteurs, l'élève peut deviner sans savoir.
// Signale les questions où la bonne réponse est la plus longue ET dépasse la
// médiane des distracteurs d'au moins 30% et 8 caractères.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const questions = [];

// Banque (JSON)
const bankDir = join(root, "src", "data", "bank");
for (const f of readdirSync(bankDir).filter((f) => f.endsWith(".json"))) {
  for (const q of JSON.parse(readFileSync(join(bankDir, f), "utf8"))) {
    if (q.type === "mcq") questions.push({ src: `bank/${f}`, ...q });
  }
}

// content.ts (extraction par regex — le format des blocs est régulier)
const content = readFileSync(join(root, "src", "data", "content.ts"), "utf8");
const blockRe =
  /id:\s*"([^"]+)",\s*type:\s*"mcq"[\s\S]*?prompt:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?choices:\s*\[([\s\S]*?)\][\s\S]*?answerIndex:\s*(\d+)/g;
let m;
while ((m = blockRe.exec(content))) {
  const choices = [...m[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((c) => c[1]);
  questions.push({ src: "content.ts", id: m[1], prompt: m[2], choices, answerIndex: Number(m[4]) });
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

let flagged = 0;
for (const q of questions) {
  const correct = q.choices[q.answerIndex];
  const others = q.choices.filter((_, i) => i !== q.answerIndex).map((c) => c.length);
  const med = median(others);
  const isLongest = correct.length > Math.max(...others);
  if (isLongest && correct.length >= med * 1.3 && correct.length - med >= 8) {
    flagged++;
    console.log(`  [${q.src}] ${q.id} — bonne réponse ${correct.length}c vs médiane ${med}c`);
    console.log(`      « ${correct.slice(0, 80)} »`);
  }
}
console.log(`\n${questions.length} QCM audités, ${flagged} signalés (biais de longueur).`);
