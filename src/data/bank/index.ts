// Banque de questions générées, organisée par objectif PER.
// Workflow de relecture : chaque question porte un statut —
//   "draft"    : générée, en attente de relecture humaine (incluse dans le POC)
//   "approved" : relue et validée par un-e enseignant-e
//   "rejected" : écartée (jamais chargée dans l'app)
// Pour valider/écarter une question, éditer son champ "status" dans le JSON.

import type { Question } from "../../types";
import mixte from "./mixte.json";
import msn21 from "./msn21.json";
import msn22 from "./msn22.json";
import msn23 from "./msn23.json";
import msn24 from "./msn24.json";

export interface BankQuestion extends Question {
  stepId: number;
  status: "draft" | "approved" | "rejected";
}

const RAW = [...msn21, ...msn22, ...msn23, ...msn24, ...mixte] as BankQuestion[];

export const BANK: BankQuestion[] = RAW.filter((q) => q.status !== "rejected");
