import { useSyncExternalStore } from "react";
import type { AppStore, ChildProfile, PlannedTest, Role, TestAnswer } from "./types";

const KEY = "per-poc-store-v3";
const OLD_KEY = "per-poc-store-v2";
const HIST_MAX = 5;

const newId = () => Math.random().toString(36).slice(2, 10);

const emptyChild = (name: string, year: number): ChildProfile => ({
  id: newId(),
  name,
  year,
  seen: {},
  practice: {},
  validated: {},
  tests: [],
  planned: [],
  revisions: [],
});

interface V2Store {
  role?: Role | null;
  child?: { name: string; year: number } | null;
  seen?: Record<number, boolean>;
  hist?: Record<number, { r: number[]; lastAt: string }>;
  validated?: Record<number, string>;
}

const load = (): AppStore => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppStore;
      return {
        ...parsed,
        parentPinHash: parsed.parentPinHash ?? null,
        children: parsed.children.map((c) => ({ ...c, revisions: c.revisions ?? [] })),
      };
    }
    // Migration depuis la v2 (un seul enfant, entraînement = ancien historique)
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const v2 = JSON.parse(old) as V2Store;
      if (v2.child) {
        const c: ChildProfile = {
          ...emptyChild(v2.child.name, v2.child.year),
          seen: v2.seen ?? {},
          practice: v2.hist ?? {},
          validated: v2.validated ?? {},
        };
        return { role: v2.role ?? null, activeChildId: c.id, children: [c], parentPinHash: null };
      }
    }
  } catch {
    /* stockage corrompu : on repart de zéro */
  }
  return { role: null, activeChildId: null, children: [], parentPinHash: null };
};

let state = load();
const listeners = new Set<() => void>();

const emit = () => {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};

const mutateChild = (childId: string, fn: (c: ChildProfile) => ChildProfile) => {
  state = {
    ...state,
    children: state.children.map((c) => (c.id === childId ? fn(c) : c)),
  };
  emit();
};

export const activeChild = (s: AppStore): ChildProfile | null =>
  s.children.find((c) => c.id === s.activeChildId) ?? s.children[0] ?? null;

export const setRole = (role: Role) => {
  state = { ...state, role };
  emit();
};

export const addChild = (name: string, year: number): string => {
  const c = emptyChild(name, year);
  state = { ...state, children: [...state.children, c], activeChildId: c.id };
  emit();
  return c.id;
};

export const setActiveChild = (childId: string) => {
  state = { ...state, activeChildId: childId };
  emit();
};

export const setChildYear = (childId: string, year: number) => {
  mutateChild(childId, (c) => ({ ...c, year }));
};

export const removeChild = (childId: string) => {
  const children = state.children.filter((c) => c.id !== childId);
  state = {
    ...state,
    children,
    activeChildId: state.activeChildId === childId ? (children[0]?.id ?? null) : state.activeChildId,
  };
  emit();
};

/** Positionnement : marque des étapes vues (ou non) en classe. */
export const setSeen = (childId: string, stepIds: number[], seen: boolean) => {
  mutateChild(childId, (c) => {
    const next = { ...c.seen };
    for (const id of stepIds) {
      if (seen) next[id] = true;
      else delete next[id];
    }
    return { ...c, seen: next };
  });
};

/** Entraînement : enregistre une réponse (n'affecte pas les contrôles). */
export const recordPractice = (childId: string, stepId: number, correct: boolean) => {
  mutateChild(childId, (c) => {
    const prev = c.practice[stepId];
    const r = [...(prev?.r ?? []), correct ? 1 : 0].slice(-HIST_MAX);
    return { ...c, practice: { ...c.practice, [stepId]: { r, lastAt: new Date().toISOString() } } };
  });
};

/** Validation parent d'une étape « à observer ». */
export const setValidated = (childId: string, stepId: number, validated: boolean) => {
  mutateChild(childId, (c) => {
    const next = { ...c.validated };
    if (validated) next[stepId] = new Date().toISOString();
    else delete next[stepId];
    return { ...c, validated: next };
  });
};

/** Parent : planifie un contrôle (questions figées à la planification). */
export const planTest = (childId: string, plan: Omit<PlannedTest, "id" | "createdAt">) => {
  mutateChild(childId, (c) => ({
    ...c,
    planned: [...c.planned, { ...plan, id: newId(), createdAt: new Date().toISOString() }],
  }));
};

export const deletePlannedTest = (childId: string, planId: string) => {
  mutateChild(childId, (c) => ({ ...c, planned: c.planned.filter((p) => p.id !== planId) }));
};

/** Parent : prépare un programme de révision (rejouable, mode entraînement). */
export const planRevision = (childId: string, plan: Omit<PlannedTest, "id" | "createdAt">) => {
  mutateChild(childId, (c) => ({
    ...c,
    revisions: [...c.revisions, { ...plan, id: newId(), createdAt: new Date().toISOString() }],
  }));
};

export const deleteRevision = (childId: string, planId: string) => {
  mutateChild(childId, (c) => ({ ...c, revisions: c.revisions.filter((p) => p.id !== planId) }));
};

/**
 * Enfant : enregistre le résultat d'un contrôle, en une fois.
 * Le contrôle planifié correspondant est consommé — pas de seconde tentative.
 */
export const recordTest = (childId: string, planId: string | null, title: string, answers: TestAnswer[]) => {
  mutateChild(childId, (c) => ({
    ...c,
    planned: planId ? c.planned.filter((p) => p.id !== planId) : c.planned,
    tests: [
      ...c.tests,
      {
        id: newId(),
        planId,
        title,
        at: new Date().toISOString(),
        answers,
        score: answers.filter((a) => a.correct).length,
        total: answers.length,
      },
    ],
  }));
};

/** Définit (hash) ou supprime (null) le code PIN parent. */
export const setParentPinHash = (hash: string | null) => {
  state = { ...state, parentPinHash: hash };
  emit();
};

export const resetAll = () => {
  state = { role: null, activeChildId: null, children: [], parentPinHash: null };
  localStorage.removeItem(OLD_KEY);
  emit();
};

export const useStore = (): AppStore =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
