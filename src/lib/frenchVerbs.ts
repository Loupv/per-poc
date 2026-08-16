// Conjugaison — tables explicites, pas de règles devinées.
// Verbes et temps exigés en 6e année par le PER (étape 4427) :
// présent, imparfait, futur, passé composé ; être, avoir, aller, aimer,
// finir, dire, faire, rendre, savoir, vouloir.

export type Tense = "présent" | "imparfait" | "futur" | "passé composé";

export const PRONOUNS = ["je", "tu", "il", "nous", "vous", "ils"] as const;

export interface Verb {
  inf: string;
  /** 6 formes par temps, dans l'ordre je / tu / il / nous / vous / ils. */
  forms: Record<Tense, string[] | null>;
}

export const VERBS: Verb[] = [
  {
    inf: "être",
    forms: {
      présent: ["suis", "es", "est", "sommes", "êtes", "sont"],
      imparfait: ["étais", "étais", "était", "étions", "étiez", "étaient"],
      futur: ["serai", "seras", "sera", "serons", "serez", "seront"],
      "passé composé": ["ai été", "as été", "a été", "avons été", "avez été", "ont été"],
    },
  },
  {
    inf: "avoir",
    forms: {
      présent: ["ai", "as", "a", "avons", "avez", "ont"],
      imparfait: ["avais", "avais", "avait", "avions", "aviez", "avaient"],
      futur: ["aurai", "auras", "aura", "aurons", "aurez", "auront"],
      "passé composé": ["ai eu", "as eu", "a eu", "avons eu", "avez eu", "ont eu"],
    },
  },
  {
    inf: "aller",
    forms: {
      présent: ["vais", "vas", "va", "allons", "allez", "vont"],
      imparfait: ["allais", "allais", "allait", "allions", "alliez", "allaient"],
      futur: ["irai", "iras", "ira", "irons", "irez", "iront"],
      // passé composé avec être : accord en genre et en nombre, hors périmètre 6e ici
      "passé composé": null,
    },
  },
  {
    inf: "aimer",
    forms: {
      présent: ["aime", "aimes", "aime", "aimons", "aimez", "aiment"],
      imparfait: ["aimais", "aimais", "aimait", "aimions", "aimiez", "aimaient"],
      futur: ["aimerai", "aimeras", "aimera", "aimerons", "aimerez", "aimeront"],
      "passé composé": ["ai aimé", "as aimé", "a aimé", "avons aimé", "avez aimé", "ont aimé"],
    },
  },
  {
    inf: "finir",
    forms: {
      présent: ["finis", "finis", "finit", "finissons", "finissez", "finissent"],
      imparfait: [
        "finissais", "finissais", "finissait", "finissions", "finissiez", "finissaient",
      ],
      futur: ["finirai", "finiras", "finira", "finirons", "finirez", "finiront"],
      "passé composé": ["ai fini", "as fini", "a fini", "avons fini", "avez fini", "ont fini"],
    },
  },
  {
    inf: "dire",
    forms: {
      présent: ["dis", "dis", "dit", "disons", "dites", "disent"],
      imparfait: ["disais", "disais", "disait", "disions", "disiez", "disaient"],
      futur: ["dirai", "diras", "dira", "dirons", "direz", "diront"],
      "passé composé": ["ai dit", "as dit", "a dit", "avons dit", "avez dit", "ont dit"],
    },
  },
  {
    inf: "faire",
    forms: {
      présent: ["fais", "fais", "fait", "faisons", "faites", "font"],
      imparfait: ["faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"],
      futur: ["ferai", "feras", "fera", "ferons", "ferez", "feront"],
      "passé composé": ["ai fait", "as fait", "a fait", "avons fait", "avez fait", "ont fait"],
    },
  },
  {
    inf: "rendre",
    forms: {
      présent: ["rends", "rends", "rend", "rendons", "rendez", "rendent"],
      imparfait: ["rendais", "rendais", "rendait", "rendions", "rendiez", "rendaient"],
      futur: ["rendrai", "rendras", "rendra", "rendrons", "rendrez", "rendront"],
      "passé composé": ["ai rendu", "as rendu", "a rendu", "avons rendu", "avez rendu", "ont rendu"],
    },
  },
  {
    inf: "savoir",
    forms: {
      présent: ["sais", "sais", "sait", "savons", "savez", "savent"],
      imparfait: ["savais", "savais", "savait", "savions", "saviez", "savaient"],
      futur: ["saurai", "sauras", "saura", "saurons", "saurez", "sauront"],
      "passé composé": ["ai su", "as su", "a su", "avons su", "avez su", "ont su"],
    },
  },
  {
    inf: "vouloir",
    forms: {
      présent: ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
      imparfait: ["voulais", "voulais", "voulait", "voulions", "vouliez", "voulaient"],
      futur: ["voudrai", "voudras", "voudra", "voudrons", "voudrez", "voudront"],
      "passé composé": ["ai voulu", "as voulu", "a voulu", "avons voulu", "avez voulu", "ont voulu"],
    },
  },
];

/** Élision : « je ai » → « j'ai ». */
export const withPronoun = (person: number, form: string): string => {
  const p = PRONOUNS[person];
  if (p === "je" && /^[aeiouéèêh]/i.test(form)) return `j'${form}`;
  return `${p} ${form}`;
};

export const TENSES: Tense[] = ["présent", "imparfait", "futur", "passé composé"];
