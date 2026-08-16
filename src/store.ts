import { useSyncExternalStore } from "react";
import type { AppStore } from "./types";

const KEY = "per-poc-store-v2";
const HIST_MAX = 5;

const load = (): AppStore => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppStore;
  } catch {
    /* stockage corrompu : on repart de zéro */
  }
  return { child: null, seen: {}, hist: {} };
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

export const resetAll = () => {
  state = { child: null, seen: {}, hist: {} };
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
