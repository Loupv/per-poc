// Gabarits génératifs — français. Mêmes principes qu'en maths : une étape
// équipée ne resert jamais deux fois la même question.
// Les formes conjuguées viennent de tables explicites (frenchVerbs.ts) ; les
// réponses à saisir sont toujours sans accent (la conjugaison passe en QCM).

import type { Question } from "../types";
import { PRONOUNS, TENSES, VERBS, withPronoun, type Tense } from "./frenchVerbs";
import { CHARACTERS, pick } from "./universe";

const ri = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const shuffle = <T,>(a: T[]): T[] => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

export interface Generator {
  id: string;
  stepId: number;
  make: () => Question;
}

// ── Conjugaison (étape 4427) ────────────────────────────────────────

/** « au présent », « à l'imparfait », « au futur », « au passé composé ». */
const auTemps = (t: Tense) => (t === "imparfait" ? "à l'imparfait" : `au ${t}`);

const conjugaison = (): Question => {
  const verb = pick(VERBS);
  const tenses = TENSES.filter((t) => verb.forms[t] !== null);
  const tense = pick(tenses) as Tense;
  const forms = verb.forms[tense]!;
  const person = ri(0, 5);
  const good = forms[person];

  // distracteurs : autres personnes du même temps, puis même personne à un autre temps
  const others = forms.filter((f, i) => i !== person && f !== good);
  const otherTense = tenses.find((t) => t !== tense);
  const crossTense = otherTense ? verb.forms[otherTense]![person] : null;
  const pool = [...new Set([...others, ...(crossTense && crossTense !== good ? [crossTense] : [])])];
  const choices = shuffle([good, ...shuffle(pool).slice(0, 3)]);

  return {
    id: "gfr-conj",
    type: "mcq",
    prompt: `Conjugue « ${verb.inf} » ${auTemps(tense)} : ${PRONOUNS[person]} …`,
    choices,
    answerIndex: choices.indexOf(good),
    explanation: `${verb.inf} ${auTemps(tense)} : ${withPronoun(person, good)}.`,
  };
};

// ── Accord sujet-verbe (étape 4390) ─────────────────────────────────

const SUJETS_SING = ["Le chien", "La maîtresse", "Mon frère", "Le voisin", "La marmotte"];
const SUJETS_PLUR = ["Les enfants", "Les oiseaux", "Mes cousins", "Les élèves", "Les marmottes"];
const VERBES_ER = [
  { inf: "jouer", sing: "joue", plur: "jouent" },
  { inf: "chanter", sing: "chante", plur: "chantent" },
  { inf: "danser", sing: "danse", plur: "dansent" },
  { inf: "marcher", sing: "marche", plur: "marchent" },
  { inf: "grimper", sing: "grimpe", plur: "grimpent" },
  { inf: "siffler", sing: "siffle", plur: "sifflent" },
];
const LIEUX = ["dans le jardin", "sur le sentier", "près du lac", "dans la cour", "sous les arbres"];

const accordSujetVerbe = (): Question => {
  const plural = Math.random() < 0.5;
  const sujet = plural ? pick(SUJETS_PLUR) : pick(SUJETS_SING);
  const v = pick(VERBES_ER);
  const good = plural ? v.plur : v.sing;
  return {
    id: "gfr-accord-v",
    type: "input",
    prompt: `Complète avec le verbe bien accordé : ${sujet} ___ ${pick(LIEUX)}. (${v.inf})`,
    accepted: [good],
    explanation: plural
      ? `Le sujet « ${sujet} » est au pluriel : le verbe prend -ent → ${good}.`
      : `Le sujet « ${sujet} » est au singulier : le verbe prend -e → ${good}.`,
  };
};

// ── Accord dans le groupe nominal (étape 4388) ──────────────────────

const NOMS_GN = [
  { m: "chat", f: null, art: "un" },
  { m: "vélo", f: null, art: "un" },
  { m: null, f: "fleur", art: "une" },
  { m: null, f: "maison", art: "une" },
  { m: null, f: "marmotte", art: "une" },
  { m: "sentier", f: null, art: "un" },
];
const ADJ = [
  { base: "joli", fem: "jolie" },
  { base: "grand", fem: "grande" },
  { base: "petit", fem: "petite" },
  { base: "vert", fem: "verte" },
  { base: "bleu", fem: "bleue" },
  { base: "gris", fem: "grise" },
];

const accordGN = (): Question => {
  const n = pick(NOMS_GN);
  const a = pick(ADJ);
  const plural = Math.random() < 0.5;
  const fem = n.f !== null;
  const nom = (fem ? n.f : n.m) as string;
  const base = fem ? a.fem : a.base;
  // pluriel : -s sauf si le masculin finit déjà par s
  const good = plural ? (base.endsWith("s") ? base : base + "s") : base;
  const groupe = plural ? `des ${nom}s` : `${n.art} ${nom}`;
  return {
    id: "gfr-accord-gn",
    type: "input",
    prompt: `Accorde l'adjectif : ${groupe} ___ (${a.base})`,
    accepted: [good],
    explanation: `« ${nom}${plural ? "s" : ""} » est ${fem ? "féminin" : "masculin"} ${
      plural ? "pluriel" : "singulier"
    } : l'adjectif s'écrit « ${good} ».`,
  };
};

// ── Homophones grammaticaux (étape 4400) ────────────────────────────

const HOMOPHONES: { pair: [string, string]; cases: { text: string; good: string; why: string }[] }[] = [
  {
    pair: ["a", "à"],
    cases: [
      { text: "{Q} ___ un nouveau vélo.", good: "a", why: "on peut dire « avait » : c'est le verbe avoir." },
      { text: "{Q} va ___ l'école à pied.", good: "à", why: "ici, « à » est un petit mot invariable, on ne peut pas dire « avait »." },
    ],
  },
  {
    pair: ["on", "ont"],
    cases: [
      { text: "___ part en promenade demain.", good: "On", why: "« on » remplace un sujet, comme « il »." },
      { text: "Ils ___ trouvé un raccourci.", good: "ont", why: "on peut dire « avaient » : c'est le verbe avoir." },
    ],
  },
  {
    pair: ["son", "sont"],
    cases: [
      { text: "{Q} a oublié ___ cahier.", good: "son", why: "« son » veut dire « le sien »." },
      { text: "Les marmottes ___ déjà réveillées.", good: "sont", why: "on peut dire « étaient » : c'est le verbe être." },
    ],
  },
  {
    pair: ["ces", "ses"],
    cases: [
      { text: "Regarde ___ montagnes au loin !", good: "ces", why: "« ces » montre des choses : celles-là, là-bas." },
      { text: "{Q} range ___ affaires dans son sac.", good: "ses", why: "« ses » veut dire « les siennes »." },
    ],
  },
];

const homophones = (): Question => {
  const h = pick(HOMOPHONES);
  const c = pick(h.cases);
  const choices = shuffle([...h.pair]);
  const goodLower = c.good.toLowerCase();
  const idx = choices.findIndex((x) => x === goodLower);
  const display = choices.map((x) => (c.good[0] === c.good[0].toUpperCase() ? x[0].toUpperCase() + x.slice(1) : x));
  return {
    id: "gfr-homo",
    type: "mcq",
    prompt: c.text.replace("{Q}", pick(CHARACTERS)),
    choices: display,
    answerIndex: idx,
    explanation: `On écrit « ${c.good} » : ${c.why}`,
  };
};

// ── Classes grammaticales (étape 4367) ──────────────────────────────

// sujets animés et objets ont leurs propres adjectifs et verbes, pour que la
// phrase générée ait toujours du sens (« un jardin curieux dort » : non merci).
const SUJETS_C = [
  { nom: "chien", adj: ["joyeux", "curieux", "calme", "fidèle"], verbes: ["dort", "court", "saute", "aboie"] },
  { nom: "renard", adj: ["curieux", "rusé", "roux", "calme"], verbes: ["dort", "court", "saute", "observe"] },
  { nom: "marmotte", adj: ["curieuse", "joyeuse", "prudente"], verbes: ["dort", "siffle", "grimpe", "observe"] },
  { nom: "vélo", adj: ["rouge", "neuf", "solide", "rouillé"], verbes: ["roule", "brille", "grince"] },
  { nom: "bateau", adj: ["blanc", "rapide", "silencieux"], verbes: ["glisse", "avance", "brille"] },
  { nom: "sentier", adj: ["étroit", "sombre", "long"], verbes: ["monte", "descend", "tourne"] },
];

const classeGrammaticale = (): Question => {
  const sujet = pick(SUJETS_C);
  const feminin = sujet.nom === "marmotte";
  const det = pick(feminin ? ["La", "Une", "Cette"] : ["Le", "Un", "Ce"]);
  const nom = sujet.nom;
  const adj = pick(sujet.adj);
  const verbe = pick(sujet.verbes);
  const phrase = `${det} ${nom} ${adj} ${verbe}.`;
  const targets = [
    { mot: det.toLowerCase(), classe: "un déterminant" },
    { mot: nom, classe: "un nom commun" },
    { mot: adj, classe: "un adjectif" },
    { mot: verbe, classe: "un verbe" },
  ];
  const t = pick(targets);
  const choices = shuffle(["un nom commun", "un adjectif", "un verbe", "un déterminant"]);
  return {
    id: "gfr-classe",
    type: "mcq",
    prompt: `Dans « ${phrase} », le mot « ${t.mot === det.toLowerCase() ? det : t.mot} » est…`,
    choices,
    answerIndex: choices.indexOf(t.classe),
    explanation:
      t.classe === "un verbe"
        ? `« ${t.mot} » dit ce que fait le ${nom} : c'est un verbe.`
        : t.classe === "un adjectif"
          ? `« ${t.mot} » décrit le ${nom} : c'est un adjectif.`
          : t.classe === "un nom commun"
            ? `« ${t.mot} » désigne une chose ou un être : c'est un nom commun.`
            : `« ${det} » accompagne le nom « ${nom} » : c'est un déterminant.`,
  };
};

// ── Types de phrases (étape 4372) ───────────────────────────────────

const typePhrase = (): Question => {
  const who = pick(CHARACTERS);
  const objet = pick(["son vélo", "ses affaires", "le cahier", "la carte du sentier"]);
  const variantes = [
    { p: `${who} range ${objet}.`, t: "déclarative", why: "elle raconte quelque chose et se termine par un point." },
    { p: `Est-ce que ${who} range ${objet} ?`, t: "interrogative", why: "elle pose une question et se termine par un point d'interrogation." },
    { p: `Où est ${objet} ?`, t: "interrogative", why: "elle pose une question et se termine par un point d'interrogation." },
    { p: `Range ${objet} !`, t: "impérative", why: "elle donne un ordre ou un conseil, sans sujet exprimé." },
    { p: `Prends la carte du sentier.`, t: "impérative", why: "elle donne un conseil, sans sujet exprimé." },
  ];
  const v = pick(variantes);
  const choices = shuffle(["déclarative", "interrogative", "impérative"]);
  return {
    id: "gfr-type",
    type: "mcq",
    prompt: `« ${v.p} » est une phrase…`,
    choices,
    answerIndex: choices.indexOf(v.t),
    explanation: `C'est une phrase ${v.t} : ${v.why}`,
  };
};

// ── Pluriels particuliers (étape 4386) ──────────────────────────────

const PLURIELS = [
  { sing: "un cheval", plur: "chevaux", why: "les noms en -al font -aux au pluriel." },
  { sing: "un journal", plur: "journaux", why: "les noms en -al font -aux au pluriel." },
  { sing: "un animal", plur: "animaux", why: "les noms en -al font -aux au pluriel." },
  { sing: "un hôpital", plur: "hôpitaux", why: "les noms en -al font -aux au pluriel." },
  { sing: "un bateau", plur: "bateaux", why: "les noms en -eau prennent un -x au pluriel." },
  { sing: "un gâteau", plur: "gâteaux", why: "les noms en -eau prennent un -x au pluriel." },
  { sing: "un oiseau", plur: "oiseaux", why: "les noms en -eau prennent un -x au pluriel." },
  { sing: "un jeu", plur: "jeux", why: "les noms en -eu prennent un -x au pluriel." },
  { sing: "un feu", plur: "feux", why: "les noms en -eu prennent un -x au pluriel." },
  { sing: "un cheveu", plur: "cheveux", why: "les noms en -eu prennent un -x au pluriel." },
  { sing: "un chapeau", plur: "chapeaux", why: "les noms en -eau prennent un -x au pluriel." },
  { sing: "un manteau", plur: "manteaux", why: "les noms en -eau prennent un -x au pluriel." },
  { sing: "un château", plur: "châteaux", why: "les noms en -eau prennent un -x au pluriel." },
  { sing: "un métal", plur: "métaux", why: "les noms en -al font -aux au pluriel." },
  { sing: "un canal", plur: "canaux", why: "les noms en -al font -aux au pluriel." },
];

const pluriel = (): Question => {
  const good = pick(PLURIELS);
  const wrongs = shuffle(
    PLURIELS.filter((p) => p.plur !== good.plur).map((p) => p.plur)
  ).slice(0, 2);
  // un faux pluriel régulier, l'erreur classique
  const naive = good.sing.split(" ")[1] + "s";
  const choices = shuffle([good.plur, naive, ...wrongs]);
  return {
    id: "gfr-pluriel",
    type: "mcq",
    prompt: `Quel est le pluriel de « ${good.sing} » ?`,
    choices,
    answerIndex: choices.indexOf(good.plur),
    explanation: `Des ${good.plur} : ${good.why}`,
  };
};

export const GENERATORS_FR: Generator[] = [
  { id: "gfr-conj", stepId: 4427, make: conjugaison },
  { id: "gfr-conj5", stepId: 4425, make: conjugaison },
  { id: "gfr-accord-v", stepId: 4390, make: accordSujetVerbe },
  { id: "gfr-accord-gn", stepId: 4388, make: accordGN },
  { id: "gfr-homo", stepId: 4400, make: homophones },
  { id: "gfr-homo2", stepId: 4399, make: homophones },
  { id: "gfr-classe", stepId: 4367, make: classeGrammaticale },
  { id: "gfr-type", stepId: 4372, make: typePhrase },
  { id: "gfr-pluriel", stepId: 4386, make: pluriel },
];
