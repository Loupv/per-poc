import { useSyncExternalStore } from "react";
import type { AppStore, Role } from "./types";

const KEY = "per-poc-store-v2";
const HIST_MAX = 5;

const load = (): AppStore => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppStore;
      return { ...parsed, validated: parsed.validated ?? {}, role: parsed.role ?? null };
    }
  } catch {
    /* stockage corrompu : on repart de zéro */
  }
  return { role: null, child: null, seen: {}, hist: {}, validated: {} };
};

let state = load();
const listeners = new Set<() => void>();

const emit = () => {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};

export const setChild = (name: string, year: number) => {
  state = { ...state, child: { name, year } };
  emit();
};

export const setRole = (role: Role) => {
  state = { ...state, role };
  emit();
};

/** Marque une liste d'étapes comme vues (ou non vues) en classe. */
export const setSeen = (stepIds: number[], seen: boolean) => {
  const next = { ...state.seen };
  for (const id of stepIds) {
    if (seen) next[id] = true;
    else delete next[id];
  }
  state = { ...state, seen: next };
  emit();
};

export const recordAnswer = (stepId: number, correct: boolean) => {
  const prev = state.hist[stepId];
  const r = [...(prev?.r ?? []), correct ? 1 : 0].slice(-HIST_MAX);
  state = {
    ...state,
    hist: { ...state.hist, [stepId]: { r, lastAt: new Date().toISOString() } },
  };
  emit();
};

/** Validation parent d'une étape « à observer » : il/elle sait le faire. */
export const setValidated = (stepId: number, validated: boolean) => {
  const next = { ...state.validated };
  if (validated) next[stepId] = new Date().toISOString();
  else delete next[stepId];
  state = { ...state, validated: next };
  emit();
};

export const resetAll = () => {
  state = { role: null, child: null, seen: {}, hist: {}, validated: {} };
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
