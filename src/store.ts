import { useSyncExternalStore } from "react";
import type { AppStore, ThemeResult } from "./types";

const KEY = "per-poc-store-v1";

const load = (): AppStore => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppStore;
  } catch {
    /* stockage corrompu : on repart de zéro */
  }
  return { child: "", results: {} };
};

let state = load();
const listeners = new Set<() => void>();

const emit = () => {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};

export const setChild = (name: string) => {
  state = { ...state, child: name };
  emit();
};

export const recordResult = (themeId: string, score: number, total: number) => {
  const prev = state.results[themeId];
  const next: ThemeResult = {
    attempts: (prev?.attempts ?? 0) + 1,
    best: Math.max(prev?.best ?? 0, score),
    last: score,
    total,
    lastAt: new Date().toISOString(),
  };
  state = { ...state, results: { ...state.results, [themeId]: next } };
  emit();
};

export const resetAll = () => {
  state = { child: "", results: {} };
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

export type ThemeStatus = "none" | "started" | "mastered";

export const themeStatus = (r?: ThemeResult): ThemeStatus => {
  if (!r) return "none";
  return r.best / r.total >= 0.8 ? "mastered" : "started";
};
