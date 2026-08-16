// Univers rotatifs : les mêmes problèmes, habillés dans un mini-monde qui change
// chaque jour. Nora et Diego sont les personnages récurrents de l'app.

export interface Universe {
  id: string;
  name: string;
  /** {who} possède {a} {obj}, en gagne/reçoit {b}. */
  add: (who: string, a: number, b: number, obj: string) => string;
  /** {who} possède {a} {obj}, en perd/donne {b}. */
  sub: (who: string, a: number, b: number, obj: string) => string;
  /** {n} groupes de {k} {obj}. */
  mult: (who: string, n: number, k: number, obj: string) => string;
  objets: string[];
}

export const CHARACTERS = ["Nora", "Diego", "Anya", "Sam"];

export const UNIVERSES: Universe[] = [
  {
    id: "marche",
    name: "Au marché",
    objets: ["pommes", "carottes", "œufs", "tomates"],
    add: (w, a, b, o) => `Au marché, ${w} a ${a} ${o} dans son panier et en achète encore ${b}. Combien de ${o} a-t-il/elle en tout ?`,
    sub: (w, a, b, o) => `${w} arrive au marché avec ${a} ${o} et en vend ${b}. Combien lui en reste-t-il ?`,
    mult: (w, n, k, o) => `Sur l'étal de ${w}, il y a ${n} cageots de ${k} ${o}. Combien de ${o} en tout ?`,
  },
  {
    id: "fusee",
    name: "Mission spatiale",
    objets: ["boulons", "capsules", "rations", "étoiles sur le radar"],
    add: (w, a, b, o) => `À bord de la fusée, ${w} compte ${a} ${o}, puis la soute en livre ${b} de plus. Total ?`,
    sub: (w, a, b, o) => `La fusée de ${w} embarque ${a} ${o} ; ${b} sont utilisés pendant le décollage. Combien en reste-t-il ?`,
    mult: (w, n, k, o) => `${w} range ${n} caisses de ${k} ${o} dans la soute. Combien de ${o} en tout ?`,
  },
  {
    id: "fouilles",
    name: "Chantier de fouilles",
    objets: ["tessons", "pièces romaines", "fossiles", "perles anciennes"],
    add: (w, a, b, o) => `Sur le chantier, ${w} a déjà trouvé ${a} ${o} ; aujourd'hui, ${b} de plus sortent de terre. Combien en tout ?`,
    sub: (w, a, b, o) => `${w} a catalogué ${a} ${o}, mais ${b} partent au musée. Combien restent au labo ?`,
    mult: (w, n, k, o) => `${w} remplit ${n} caisses de ${k} ${o} chacune. Combien de ${o} en tout ?`,
  },
  {
    id: "foret",
    name: "Cabane en forêt",
    objets: ["pives", "branches", "noisettes", "feuilles rousses"],
    add: (w, a, b, o) => `Pour la cabane, ${w} a ramassé ${a} ${o}, puis en rapporte encore ${b}. Combien en tout ?`,
    sub: (w, a, b, o) => `${w} avait ${a} ${o} près de la cabane ; un écureuil en chipe ${b}. Combien en reste-t-il ?`,
    mult: (w, n, k, o) => `${w} fait ${n} tas de ${k} ${o}. Combien de ${o} en tout ?`,
  },
];

/** L'univers du jour — déterministe, tourne chaque jour. */
export function universeOfToday(): Universe {
  const day = Math.floor(Date.now() / 86_400_000);
  return UNIVERSES[day % UNIVERSES.length];
}

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
