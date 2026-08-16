export type Domain = "maths" | "francais" | "sciences" | "shs";
export type Role = "child" | "parent";

export type QuestionType = "mcq" | "input" | "multi" | "order" | "match" | "sort";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation: string;
  /** mcq et multi : les propositions. */
  choices?: string[];
  /** mcq : index de la bonne réponse. */
  answerIndex?: number;
  /** input : réponses acceptées. */
  accepted?: string[];
  /** multi : indices de TOUTES les bonnes réponses. */
  correctIndices?: number[];
  /** order : les éléments dans le bon ordre (mélangés à l'affichage). */
  items?: string[];
  /** match : paires correctes [gauche, droite]. */
  pairs?: [string, string][];
  /** sort : catégories et leurs éléments (mélangés à l'affichage). */
  buckets?: { name: string; items: string[] }[];
  /** Figure SVG affichée avec l'énoncé (id du registre de figures). */
  figure?: string;
  /** mcq : figures affichées comme choix (alignées sur `choices`, qui sert de libellé A/B/C/D). */
  choiceFigures?: string[];
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
  /** Derniers résultats d'entraînement, 1 = juste, 0 = faux (max 5, le plus récent en dernier). */
  r: number[];
  lastAt: string;
}

export interface TestAnswer {
  questionId: string;
  stepId: number;
  correct: boolean;
}

/** Un contrôle passé : enregistré en une fois, jamais modifié ni repassé. */
export interface TestRecord {
  id: string;
  planId: string | null;
  title: string;
  at: string;
  answers: TestAnswer[];
  score: number;
  total: number;
}

/** Un contrôle planifié par un parent, en attente d'être passé. */
export interface PlannedTest {
  id: string;
  title: string;
  domain: Domain | "toutes";
  questionIds: string[];
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  year: number;
  /** stepId -> vu en classe (positionnement parent, année en cours). */
  seen: Record<number, boolean>;
  /** stepId -> historique d'entraînement (n'engage pas les résultats officiels). */
  practice: Record<number, StepHistory>;
  /** stepId -> date de validation parent (étapes « à observer »). */
  validated: Record<number, string>;
  /** Contrôles passés (immuables). */
  tests: TestRecord[];
  /** Contrôles planifiés, en attente. */
  planned: PlannedTest[];
  /** Programmes de révision préparés par un parent (rejouables, mode entraînement). */
  revisions: PlannedTest[];
  /** Journal des fautes (entraînement et contrôles), plus récentes en dernier. */
  mistakes: Mistake[];
  /** Séances d'entraînement terminées. */
  sessions: PracticeSession[];
  /** questionId -> dernière fois vue (mémoire de fraîcheur anti-répétition). */
  qSeen: Record<string, string>;
}

/** Une faute : question ratée, avec son contexte. */
export interface Mistake {
  q: string;
  s: number;
  at: string;
  mode: "practice" | "test";
}

/** Une séance d'entraînement terminée. */
export interface PracticeSession {
  at: string;
  title: string;
  score: number;
  total: number;
}

export interface AppStore {
  role: Role | null;
  activeChildId: string | null;
  children: ChildProfile[];
  /** Hash (SHA-256 salé) du code PIN parent — null si aucun PIN défini. */
  parentPinHash: string | null;
}
