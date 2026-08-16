// Classification des étapes du PER : "quiz" (auto-testable dans l'app) vs "observe"
// (production orale/écrite, manipulation, expérimentation — à valider par un parent).
// Heuristique par objectif + mots-clés, à affiner à la main dans le JSON produit.
// Sortie : src/data/classification.json — liste des ids d'étapes "observe"
// (toute étape absente de la liste est considérée "quiz").

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
const per = JSON.parse(readFileSync(join(dir, "per.json"), "utf8"));

// Objectifs entièrement "à observer" : production écrite (L1 22), production de
// l'oral (L1 24), lecture suivie d'ouvrages (L1 25), écriture/instruments (L1 28).
const OBSERVE_OBJECTIVES = new Set(["L1 22", "L1 24", "L1 25", "L1 28"]);

// La compréhension de l'oral (L1 23) est auto-testable à terme (audio) : "quiz".
// Étapes de manipulation / production repérées par mots-clés :
const OBSERVE_KEYWORDS =
  /présente oralement|oralis|à voix haute|récitation|mise en voix|théâtral|expériment|manipul|matériel|ciseaux|pliage|découpag|papier-calque|papier à réseau|calligraph|écriture cursive|liaisons|copie de textes|clavier|logiciel|traitement de texte|mise en page|chant|débat|discussion|exposé|jeux? de rôle|dramatis|mémorisation et récitation|construction (de|d'une figure)|dessin (de|à main)|croquis|gabarit|instruments? de géométrie|règle graduée pour mesurer|mesurage effectif|enquête|recherche documentaire|projet personnel/i;

const observe = [];
let total = 0;
const samples = { observe: [], quiz: [] };

for (const o of per.objectives) {
  for (const g of o.groups) {
    for (const s of g.steps) {
      total++;
      const isObserve = OBSERVE_OBJECTIVES.has(o.code) || OBSERVE_KEYWORDS.test(s.text);
      if (isObserve) {
        observe.push(s.id);
        if (samples.observe.length < 8) samples.observe.push(`${o.code} ${s.text.slice(0, 90)}`);
      } else if (samples.quiz.length < 8) {
        samples.quiz.push(`${o.code} ${s.text.slice(0, 90)}`);
      }
    }
  }
}

writeFileSync(
  join(dir, "classification.json"),
  JSON.stringify({ note: "ids des étapes 'à observer' ; les autres sont 'quiz'", observe }, null, 1)
);

console.log(`Total: ${total} étapes — à observer: ${observe.length}, quiz: ${total - observe.length}`);
console.log("\nExemples 'à observer':");
samples.observe.forEach((s) => console.log("  •", s));
console.log("\nExemples 'quiz':");
samples.quiz.forEach((s) => console.log("  •", s));
