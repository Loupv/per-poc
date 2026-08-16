import { BANK } from "../data/bank";
import classification from "../data/classification.json";
import per from "../data/per.json";
import { THEMES } from "../data/content";
import { QUESTION_STEP } from "../data/stepMap";
import { GENERATORS, GENERATORS_BY_STEP } from "./generators";
import type { ChildProfile, Domain, Question, Theme } from "../types";

// ── Classification quiz / à observer ────────────────────────────────

const OBSERVE_STEPS = new Set<number>((classification as { observe: number[] }).observe);

export type StepKind = "quiz" | "observe";

export const stepKind = (stepId: number): StepKind =>
  OBSERVE_STEPS.has(stepId) ? "observe" : "quiz";

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

/** Matière (au sens de l'app) d'un objectif PER. */
export const objectiveDomain = (code: string): Domain =>
  code.startsWith("L1")
    ? "francais"
    : code.startsWith("SHS")
      ? "shs"
      : /^MSN 2[678]/.test(code)
        ? "sciences"
        : "maths";

export const DOMAIN_LABEL: Record<Domain, string> = {
  maths: "Maths",
  francais: "Français",
  sciences: "Sciences",
  shs: "Histoire-Géo",
};

// ── Questions indexées par étape ────────────────────────────────────

export interface MissionQuestion {
  question: Question;
  stepId: number;
  theme: Theme;
}

// Thèmes synthétiques pour les questions de la banque (couleur du domaine, pas de fiche)
const bankTheme = (d: Domain): Theme => ({
  id: `bank-${d}`,
  domain: d,
  emoji: "🧮",
  title: DOMAIN_LABEL[d],
  subtitle: "",
  perCode: "",
  attentes: [],
  fiche: [],
  questions: [],
});

const BANK_THEME: Record<Domain, Theme> = {
  maths: bankTheme("maths"),
  francais: bankTheme("francais"),
  sciences: bankTheme("sciences"),
  shs: bankTheme("shs"),
};

const THEME_QUESTIONS: MissionQuestion[] = THEMES.flatMap((theme) =>
  theme.questions.map((question) => ({
    question,
    stepId: QUESTION_STEP[question.id],
    theme,
  }))
).filter((mq) => mq.stepId !== undefined);

const BANK_QUESTIONS: MissionQuestion[] = BANK.map((q) => {
  const info = STEP_INDEX.get(q.stepId);
  const domain = info ? objectiveDomain(info.objective.code) : "maths";
  return { question: q, stepId: q.stepId, theme: BANK_THEME[domain] };
}).filter((mq) => STEP_INDEX.has(mq.stepId));

export const ALL_QUESTIONS: MissionQuestion[] = [...THEME_QUESTIONS, ...BANK_QUESTIONS];

const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((mq) => [mq.question.id, mq]));
const GENERATOR_BY_ID = new Map(GENERATORS.map((g) => [g.id, g]));

const wrapGenerated = (stepId: number, q: Question): MissionQuestion => {
  const info = STEP_INDEX.get(stepId);
  const domain = info ? objectiveDomain(info.objective.code) : "maths";
  return { question: q, stepId, theme: BANK_THEME[domain] };
};

/** Résout une question par id — les ids de gabarits produisent une instance fraîche. */
export const questionById = (id: string): MissionQuestion | undefined => {
  const staticQ = QUESTION_BY_ID.get(id);
  if (staticQ) return staticQ;
  const gen = GENERATOR_BY_ID.get(id);
  return gen ? wrapGenerated(gen.stepId, shuffleQuestion(gen.make())) : undefined;
};

const QUESTIONS_BY_STEP = new Map<number, MissionQuestion[]>();
for (const mq of ALL_QUESTIONS) {
  const list = QUESTIONS_BY_STEP.get(mq.stepId) ?? [];
  list.push(mq);
  QUESTIONS_BY_STEP.set(mq.stepId, list);
}

export const stepHasQuestions = (stepId: number) =>
  QUESTIONS_BY_STEP.has(stepId) || GENERATORS_BY_STEP.has(stepId);

// ── Mélange des choix (anti « c'est toujours le 2e ») ───────────────

export function shuffleQuestion(q: Question): Question {
  if ((q.type !== "mcq" && q.type !== "multi") || !q.choices) return q;
  const idx = q.choices.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const out: Question = { ...q, choices: idx.map((i) => q.choices![i]) };
  if (q.choiceFigures) {
    out.choiceFigures = idx.map((i) => q.choiceFigures![i]);
    // les lettres A-D restent des étiquettes de position
    out.choices = q.choices.slice(0, idx.length);
  }
  if (q.type === "mcq") out.answerIndex = idx.indexOf(q.answerIndex!);
  else out.correctIndices = (q.correctIndices ?? []).map((c) => idx.indexOf(c));
  return out;
}

// ── Sélection avec fraîcheur ────────────────────────────────────────

const WEEK = 7 * 24 * 3600 * 1000;

/**
 * Choisit `count` questions pour une étape : les gabarits génératifs sont
 * privilégiés (toujours inédits) ; les questions figées passent par la mémoire
 * de fraîcheur — ratées récemment d'abord, puis jamais vues, puis les plus anciennes.
 */
export function pickQuestionsForStep(child: ChildProfile, stepId: number, count: number): MissionQuestion[] {
  const gens = GENERATORS_BY_STEP.get(stepId) ?? [];
  const recentFails = new Set(
    child.mistakes.filter((m) => Date.now() - Date.parse(m.at) < WEEK).map((m) => m.q)
  );
  const statics = [...(QUESTIONS_BY_STEP.get(stepId) ?? [])].sort((a, b) => {
    const fa = recentFails.has(a.question.id) ? 0 : 1;
    const fb = recentFails.has(b.question.id) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    const sa = child.qSeen[a.question.id] ?? "";
    const sb = child.qSeen[b.question.id] ?? "";
    return sa.localeCompare(sb); // jamais vu ("") d'abord, puis les plus anciennes
  });

  const picked: MissionQuestion[] = [];
  let si = 0;
  for (let i = 0; i < count; i++) {
    const useGen = gens.length > 0 && (si >= statics.length || Math.random() < 0.6);
    if (useGen) {
      const g = gens[Math.floor(Math.random() * gens.length)];
      picked.push(wrapGenerated(stepId, shuffleQuestion(g.make())));
    } else if (si < statics.length) {
      const mq = statics[si++];
      picked.push({ ...mq, question: shuffleQuestion(mq.question) });
    } else break;
  }
  return picked;
}

// ── Résultats de contrôle par étape (source officielle) ─────────────

export type TestOutcome = "none" | "ok" | "ko";

/** Dernier résultat de contrôle sur une étape (les contrôles sont immuables). */
export function testOutcome(child: ChildProfile, stepId: number): TestOutcome {
  let latest: { at: string; correct: boolean } | null = null;
  for (const t of child.tests)
    for (const a of t.answers)
      if (a.stepId === stepId && (!latest || t.at > latest.at)) latest = { at: t.at, correct: a.correct };
  return latest === null ? "none" : latest.correct ? "ok" : "ko";
}

/** Statut officiel d'une étape (parent) : contrôles + validations uniquement. */
export type Mastery = "untested" | "fragile" | "mastered";

export const stepStatus = (child: ChildProfile, stepId: number): Mastery => {
  if (child.validated[stepId]) return "mastered";
  const t = testOutcome(child, stepId);
  if (t === "ok") return "mastered";
  if (t === "ko") return "fragile";
  return "untested";
};

/** Niveau d'entraînement (pour guider les missions — n'engage rien). */
export const practiceLevel = (child: ChildProfile, stepId: number): Mastery => {
  const h = child.practice[stepId];
  if (!h || h.r.length === 0) return "untested";
  const r = h.r;
  if (r.length >= 2 && r[r.length - 1] === 1 && r[r.length - 2] === 1) return "mastered";
  return "fragile";
};

// ── Moteur de mission (entraînement) ────────────────────────────────

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

export function buildMission(child: ChildProfile, mode: MissionMode): MissionQuestion[] {
  const year = mode.kind === "current" ? child.year : mode.year;

  const candidates: { stepId: number; level: Mastery; lastAt: string }[] = [];
  for (const [stepId, info] of STEP_INDEX) {
    if (!stepInYear(info.step, year)) continue;
    if (!stepHasQuestions(stepId)) continue;
    if (mode.kind === "current" && !child.seen[stepId]) continue;
    candidates.push({
      stepId,
      level: practiceLevel(child, stepId),
      lastAt: child.practice[stepId]?.lastAt ?? "",
    });
  }

  const ordered = [
    ...shuffle(candidates.filter((c) => c.level === "untested")),
    ...shuffle(candidates.filter((c) => c.level === "fragile")),
    ...candidates.filter((c) => c.level === "mastered").sort((a, b) => a.lastAt.localeCompare(b.lastAt)),
  ];

  const picked: MissionQuestion[] = [];
  for (const c of ordered) {
    if (picked.length >= MISSION_SIZE) break;
    for (const mq of pickQuestionsForStep(child, c.stepId, 2)) {
      if (picked.length >= MISSION_SIZE) break;
      picked.push(mq);
    }
  }
  return picked;
}

// ── Construction d'un contrôle (parent) ─────────────────────────────

export const TEST_SIZE = 10;

/**
 * Choisit les questions d'un contrôle : étapes de l'année, de la matière demandée,
 * en privilégiant celles bien entraînées mais jamais contrôlées, puis les vues
 * jamais contrôlées, puis le reste. Une question par étape autant que possible.
 */
export function buildTest(child: ChildProfile, domain: Domain | "toutes"): MissionQuestion[] {
  const candidates: { stepId: number; prio: number }[] = [];
  for (const [stepId, info] of STEP_INDEX) {
    if (!stepInYear(info.step, child.year)) continue;
    if (!stepHasQuestions(stepId)) continue;
    if (domain !== "toutes" && objectiveDomain(info.objective.code) !== domain) continue;
    if (Object.keys(child.seen).length > 0 && !child.seen[stepId]) continue;
    const t = testOutcome(child, stepId);
    const p = practiceLevel(child, stepId);
    const prio = t === "none" && p === "mastered" ? 0 : t === "none" ? 1 : t === "ko" ? 2 : 3;
    candidates.push({ stepId, prio });
  }
  const ordered = [0, 1, 2, 3].flatMap((p) => shuffle(candidates.filter((c) => c.prio === p)));
  const picked: MissionQuestion[] = [];
  for (const c of ordered) {
    if (picked.length >= TEST_SIZE) break;
    const qs = pickQuestionsForStep(child, c.stepId, 1);
    if (qs.length) picked.push(qs[0]);
  }
  return picked;
}

// ── Recommandations (parent) ────────────────────────────────────────

export interface Recommendations {
  readyToTest: StepInfo[]; // bien entraîné, jamais contrôlé -> planifier un contrôle
  toRework: StepInfo[]; // raté au dernier contrôle -> fiche + entraînement
  toPractice: StepInfo[]; // vu en classe, jamais entraîné -> lancer des missions
}

export function recommendations(child: ChildProfile, limit = 5): Recommendations {
  const out: Recommendations = { readyToTest: [], toRework: [], toPractice: [] };
  for (const [stepId, info] of STEP_INDEX) {
    if (!stepInYear(info.step, child.year)) continue;
    if (stepKind(stepId) === "observe") continue;
    const t = testOutcome(child, stepId);
    const p = practiceLevel(child, stepId);
    if (t === "ko" && out.toRework.length < limit) out.toRework.push(info);
    else if (t === "none" && p === "mastered" && out.readyToTest.length < limit) out.readyToTest.push(info);
    else if (
      t === "none" &&
      p === "untested" &&
      child.seen[stepId] &&
      stepHasQuestions(stepId) &&
      out.toPractice.length < limit
    )
      out.toPractice.push(info);
  }
  return out;
}

// ── Statistiques ────────────────────────────────────────────────────

export interface ObjectiveStats {
  total: number;
  seen: number;
  evaluated: number; // contrôlé ou validé par un parent
  mastered: number; // dernier contrôle juste, ou validé
  withQuestions: number;
  observe: number;
  validated: number;
}

const EMPTY: ObjectiveStats = {
  total: 0, seen: 0, evaluated: 0, mastered: 0, withQuestions: 0, observe: 0, validated: 0,
};

export function objectiveStats(child: ChildProfile, objective: PerObjective, year: number): ObjectiveStats {
  const s = { ...EMPTY };
  for (const group of objective.groups)
    for (const step of group.steps) {
      if (!stepInYear(step, year)) continue;
      s.total++;
      if (child.seen[step.id]) s.seen++;
      if (stepHasQuestions(step.id)) s.withQuestions++;
      if (stepKind(step.id) === "observe") {
        s.observe++;
        if (child.validated[step.id]) s.validated++;
      }
      const m = stepStatus(child, step.id);
      if (m !== "untested") s.evaluated++;
      if (m === "mastered") s.mastered++;
    }
  return s;
}

/** Répartition par état des étapes d'une matière — pour le dashboard parent. */
export interface DomainStats {
  total: number;
  toPosition: number; // pas encore marquées vues
  inProgress: number; // vues en classe, pas encore évaluées
  toReview: number; // raté au dernier contrôle
  mastered: number; // contrôle réussi ou validation parent
}

const addToBreakdown = (s: DomainStats, child: ChildProfile, stepId: number) => {
  s.total++;
  const m = stepStatus(child, stepId);
  if (m === "mastered") s.mastered++;
  else if (m === "fragile") s.toReview++;
  else if (child.seen[stepId]) s.inProgress++;
  else s.toPosition++;
};

export function domainStats(child: ChildProfile, domain: Domain, year: number): DomainStats {
  const s: DomainStats = { total: 0, toPosition: 0, inProgress: 0, toReview: 0, mastered: 0 };
  for (const [stepId, info] of STEP_INDEX) {
    if (!stepInYear(info.step, year)) continue;
    if (objectiveDomain(info.objective.code) !== domain) continue;
    addToBreakdown(s, child, stepId);
  }
  return s;
}

export function objectiveBreakdown(child: ChildProfile, objective: PerObjective, year: number): DomainStats {
  const s: DomainStats = { total: 0, toPosition: 0, inProgress: 0, toReview: 0, mastered: 0 };
  for (const group of objective.groups)
    for (const step of group.steps) {
      if (!stepInYear(step, year)) continue;
      addToBreakdown(s, child, step.id);
    }
  return s;
}

/**
 * Positionnement express : pour chaque objectif de la matière, sélectionne la
 * première fraction des étapes dans l'ordre du plan d'études. Approximatif par
 * nature — le programme détaillé permet d'affiner.
 */
export function expressSelection(
  domain: Domain,
  year: number,
  fraction: number
): { see: number[]; unsee: number[] } {
  const see: number[] = [];
  const unsee: number[] = [];
  for (const objective of OBJECTIVES) {
    if (objectiveDomain(objective.code) !== domain) continue;
    const steps = objective.groups.flatMap((g) => g.steps.filter((s) => stepInYear(s, year)));
    const k = Math.round(steps.length * fraction);
    steps.forEach((s, i) => (i < k ? see : unsee).push(s.id));
  }
  return { see, unsee };
}

/** Fraction de l'année scolaire écoulée (rentrée fin août → fin juin). */
export function schoolYearFraction(now: Date): number {
  const m = now.getMonth(); // 0 = janvier
  const sinceSept = m >= 8 ? m - 8 : m + 4; // sept = 0 … juin = 9
  if (m === 6 || m === 7) return m === 6 ? 1 : 0; // juillet : année finie ; août : rentrée
  return Math.min(1, Math.max(0, (sinceSept + 0.5) / 10));
}

/**
 * Questions d'un programme de révision : priorité aux étapes ratées en contrôle,
 * puis aux vues jamais entraînées, puis aux fragiles à l'entraînement.
 */
export function buildRevision(child: ChildProfile, domain: Domain | "toutes"): MissionQuestion[] {
  const candidates: { stepId: number; prio: number }[] = [];
  for (const [stepId, info] of STEP_INDEX) {
    if (!stepInYear(info.step, child.year)) continue;
    if (!stepHasQuestions(stepId)) continue;
    if (domain !== "toutes" && objectiveDomain(info.objective.code) !== domain) continue;
    if (Object.keys(child.seen).length > 0 && !child.seen[stepId]) continue;
    const t = testOutcome(child, stepId);
    const p = practiceLevel(child, stepId);
    const prio = t === "ko" ? 0 : p === "untested" ? 1 : p === "fragile" ? 2 : 3;
    candidates.push({ stepId, prio });
  }
  const ordered = [0, 1, 2, 3].flatMap((p) => shuffle(candidates.filter((c) => c.prio === p)));
  const picked: MissionQuestion[] = [];
  for (const c of ordered) {
    if (picked.length >= MISSION_SIZE) break;
    const qs = pickQuestionsForStep(child, c.stepId, 1);
    if (qs.length) picked.push(qs[0]);
  }
  return picked;
}

export function globalStats(child: ChildProfile, year: number): ObjectiveStats {
  return OBJECTIVES.reduce((acc, o) => {
    const s = objectiveStats(child, o, year);
    return {
      total: acc.total + s.total,
      seen: acc.seen + s.seen,
      evaluated: acc.evaluated + s.evaluated,
      mastered: acc.mastered + s.mastered,
      withQuestions: acc.withQuestions + s.withQuestions,
      observe: acc.observe + s.observe,
      validated: acc.validated + s.validated,
    };
  }, { ...EMPTY });
}
