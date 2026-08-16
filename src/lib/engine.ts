import per from "../data/per.json";
import { THEMES } from "../data/content";
import { QUESTION_STEP } from "../data/stepMap";
import type { AppStore, Question, Theme } from "../types";

// ── Index du référentiel PER ────────────────────────────────────────

export interface PerStep {
  id: number;
  text: string;
  years: number[];
}

export interface PerGroup {
  id: number;
  path: string[];
  steps: PerStep[];
  attentes: { id: number; text: string }[];
}

export interface PerObjective {
  id: number;
  code: string;
  name: string;
  domain: string;
  groups: PerGroup[];
}

export const OBJECTIVES = (per as { objectives: PerObjective[] }).objectives;

export interface StepInfo {
  step: PerStep;
  group: PerGroup;
  objective: PerObjective;
}

const STEP_INDEX = new Map<number, StepInfo>();
for (const objective of OBJECTIVES)
  for (const group of objective.groups)
    for (const step of group.steps)
      STEP_INDEX.set(step.id, { step, group, objective });

export const stepInfo = (id: number) => STEP_INDEX.get(id);

export const stepInYear = (step: PerStep, year: number) =>
  step.years.length === 0 || step.years.includes(year);

// ── Questions indexées par étape ────────────────────────────────────

export interface MissionQuestion {
  question: Question;
  stepId: number;
  theme: Theme;
}

export const ALL_QUESTIONS: MissionQuestion[] = THEMES.flatMap((theme) =>
  theme.questions.map((question) => ({
    question,
    stepId: QUESTION_STEP[question.id],
    theme,
  }))
).filter((mq) => mq.stepId !== undefined);

const QUESTIONS_BY_STEP = new Map<number, MissionQuestion[]>();
for (const mq of ALL_QUESTIONS) {
  const list = QUESTIONS_BY_STEP.get(mq.stepId) ?? [];
  list.push(mq);
  QUESTIONS_BY_STEP.set(mq.stepId, list);
}

export const stepHasQuestions = (stepId: number) => QUESTIONS_BY_STEP.has(stepId);

// ── Maîtrise par étape ──────────────────────────────────────────────

export type Mastery = "untested" | "fragile" | "mastered";

export const stepMastery = (store: AppStore, stepId: number): Mastery => {
  const h = store.hist[stepId];
  if (!h || h.r.length === 0) return "untested";
  const r = h.r;
  if (r.length >= 2 && r[r.length - 1] === 1 && r[r.length - 2] === 1) return "mastered";
  if (r.length === 1 && r[0] === 1) return "fragile"; // un seul succès : à confirmer
  return "fragile";
};

// ── Moteur de mission ───────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export type MissionMode = { kind: "current" } | { kind: "pastYear"; year: number };

export const MISSION_SIZE = 10;

/**
 * Sélectionne les questions de la mission :
 * - année en cours : uniquement les étapes marquées "vues en classe" ;
 * - année précédente : toutes les étapes de l'année (on teste tout).
 * Priorité : jamais testé > fragile > maîtrisé (le plus ancien d'abord).
 */
export function buildMission(store: AppStore, mode: MissionMode): MissionQuestion[] {
  const year = mode.kind === "current" ? store.child!.year : mode.year;

  const candidates: { stepId: number; mastery: Mastery; lastAt: string }[] = [];
  for (const [stepId, info] of STEP_INDEX) {
    if (!stepInYear(info.step, year)) continue;
    if (!QUESTIONS_BY_STEP.has(stepId)) continue;
    if (mode.kind === "current" && !store.seen[stepId]) continue;
    candidates.push({
      stepId,
      mastery: stepMastery(store, stepId),
      lastAt: store.hist[stepId]?.lastAt ?? "",
    });
  }

  const rank = { untested: 0, fragile: 1, mastered: 2 } as const;
  const ordered = [
    ...shuffle(candidates.filter((c) => c.mastery === "untested")),
    ...shuffle(candidates.filter((c) => c.mastery === "fragile")),
    ...candidates.filter((c) => c.mastery === "mastered").sort((a, b) => a.lastAt.localeCompare(b.lastAt)),
  ];
  void rank;

  const picked: MissionQuestion[] = [];
  for (const c of ordered) {
    if (picked.length >= MISSION_SIZE) break;
    const pool = shuffle(QUESTIONS_BY_STEP.get(c.stepId)!);
    for (const mq of pool.slice(0, 2)) {
      if (picked.length >= MISSION_SIZE) break;
      picked.push(mq);
    }
  }
  return picked;
}

// ── Statistiques pour le dashboard / programme ──────────────────────

export interface ObjectiveStats {
  total: number;
  seen: number;
  tested: number;
  mastered: number;
  withQuestions: number;
}

export function objectiveStats(store: AppStore, objective: PerObjective, year: number): ObjectiveStats {
  const s: ObjectiveStats = { total: 0, seen: 0, tested: 0, mastered: 0, withQuestions: 0 };
  for (const group of objective.groups)
    for (const step of group.steps) {
      if (!stepInYear(step, year)) continue;
      s.total++;
      if (store.seen[step.id]) s.seen++;
      if (QUESTIONS_BY_STEP.has(step.id)) s.withQuestions++;
      const m = stepMastery(store, step.id);
      if (m !== "untested") s.tested++;
      if (m === "mastered") s.mastered++;
    }
  return s;
}
