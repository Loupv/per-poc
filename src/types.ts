export type Domain = "maths" | "francais";

export interface Question {
  id: string;
  type: "mcq" | "input";
  prompt: string;
  choices?: string[];
  answerIndex?: number;
  accepted?: string[];
  explanation: string;
}

export interface FicheSection {
  title: string;
  body: string;
  examples?: string[];
}

export interface Theme {
  id: string;
  domain: Domain;
  emoji: string;
  title: string;
  subtitle: string;
  perCode: string;
  attentes: string[];
  passage?: string;
  fiche: FicheSection[];
  questions: Question[];
}

export interface StepHistory {
  /** Derniers résultats, 1 = juste, 0 = faux (max 5, le plus récent en dernier). */
  r: number[];
  lastAt: string;
}

export interface AppStore {
  child: { name: string; year: number } | null;
  /** stepId -> vu en classe (positionnement parent, année en cours). */
  seen: Record<number, boolean>;
  /** stepId -> historique des réponses. */
  hist: Record<number, StepHistory>;
  /** stepId -> date de validation parent (étapes « à observer » : il/elle sait le faire). */
  validated: Record<number, string>;
}
