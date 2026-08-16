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

export interface ThemeResult {
  attempts: number;
  best: number;
  last: number;
  total: number;
  lastAt: string;
}

export interface AppStore {
  child: string;
  results: Record<string, ThemeResult>;
}
