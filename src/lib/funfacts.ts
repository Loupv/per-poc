// « Le savais-tu ? » — micro-récompenses par la curiosité, affichées de temps en
// temps après une bonne réponse en entraînement. Une phrase, pas plus.

import type { Domain } from "../types";

export const FUN_FACTS: Record<Domain, string[]> = {
  maths: [
    "Le zéro a été inventé bien après les autres chiffres — les Romains n'en avaient pas !",
    "Un million de secondes, c'est 11 jours. Un milliard de secondes… 31 ans !",
    "L'apostrophe de 10'000 est une spécialité suisse — en France, on met un espace.",
    "En pliant une feuille de papier 42 fois, elle serait assez épaisse pour atteindre la Lune.",
    "Le mot « calcul » vient de « calculus » : petit caillou — les Romains comptaient avec des cailloux.",
    "Les abeilles construisent des hexagones parce que c'est la forme qui utilise le moins de cire.",
  ],
  francais: [
    "Le mot le plus long du dictionnaire français est « anticonstitutionnellement » : 25 lettres.",
    "« Oiseaux » est le plus petit mot qui contient les six voyelles… sans en prononcer aucune seule !",
    "Le français compte plus de 60'000 mots, mais on en utilise environ 3'000 au quotidien.",
    "« Septante » et « nonante » sont plus logiques que « soixante-dix » — et plus anciens !",
  ],
  sciences: [
    "Ton cœur bat environ 100'000 fois par jour — sans jamais prendre de pause.",
    "Les os des enfants sont plus nombreux que ceux des adultes : certains se soudent en grandissant.",
    "Un éclair est cinq fois plus chaud que la surface du Soleil.",
    "Les arbres d'une forêt communiquent entre eux par leurs racines et des champignons.",
    "La langue est le muscle le plus agile du corps : elle fait des milliers de mouvements par jour.",
    "Certaines chenilles deviennent papillons en liquéfiant presque tout leur corps dans la chrysalide.",
  ],
  shs: [
    "La cathédrale de Genève a presque 1'000 ans — un millénaire entier !",
    "À l'époque romaine, Genève s'appelait « Genava » et était déjà un port important.",
    "Le Rhône traverse tout le lac Léman sans vraiment se mélanger à son eau.",
    "La Préhistoire a duré des millions d'années — l'histoire écrite, seulement 5'000 ans.",
    "Les hommes préhistoriques de nos régions chassaient des mammouths au bord du Rhône.",
    "La Suisse a 4 langues nationales — et le romanche est parlé par moins de 1% des Suisses.",
  ],
};

/** Un fait au hasard pour un domaine, en évitant ceux déjà montrés. */
export function pickFact(domain: Domain, shown: Set<string>): string | null {
  const pool = FUN_FACTS[domain].filter((f) => !shown.has(f));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
