// Ingestion du Plan d'études romand depuis l'API publique per.ciip.ch — v2 "par étapes"
// Cible : cycle 2 (années 5-8), domaines Mathématiques (MSN 21-25) et Français (L1).
// Chaque "étape" = une progression d'apprentissage du PER, avec son id officiel,
// ses années, son groupe (attentes fondamentales liées) et sa section nommée.
// Sortie : src/data/per.json
//
// NOTE légale : données © CIIP — usage commercial à clarifier avec la CIIP avant tout lancement.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://per.ciip.ch/api";
const CODE_PREFIXES = ["MSN 2", "L1 2", "SHS 2"];

const stripHtml = (html) =>
  (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const fetchJson = async (path) => {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
};

const yearsOf = (yearDistributions) =>
  [...new Set((yearDistributions ?? []).flatMap((yd) => (yd.years ?? []).map((y) => y.year)))].sort();

// Aplatit l'arbre en "groupes" = une progression du PER (ligne du tableau officiel),
// portant ses étapes (learnings) et ses attentes fondamentales.
function collectGroups(sections, path, out) {
  for (const s of sections ?? []) {
    const name = stripHtml(s.name);
    const nextPath = name ? [...path, name] : path;
    for (const prog of s.progressions ?? []) {
      const steps = (prog.learnings ?? [])
        .map((l) => ({
          id: l.id,
          text: stripHtml(l.content?.html),
          years: yearsOf(l.yearDistributions),
        }))
        .filter((l) => l.text && !/^Manuels? \d/.test(l.text));
      const attentes = [
        ...new Map(
          (prog.fundamentalExpectations ?? [])
            .map((fe) => [fe.id, stripHtml(fe.content?.html)])
            .filter(([, t]) => t)
        ).entries(),
      ].map(([id, text]) => ({ id, text }));
      if (steps.length) out.push({ id: prog.id, path: nextPath, steps, attentes });
    }
    collectGroups(s.children, nextPath, out);
  }
  return out;
}

const cycle2 = await fetchJson("/cycles/2");
const targets = new Map();
for (const lo of cycle2.learningObjectives) {
  if (CODE_PREFIXES.some((p) => lo.code.startsWith(p))) targets.set(lo.id, lo);
}

const objectives = [];
let stepCount = 0;
for (const [id, brief] of targets) {
  process.stdout.write(`  ${brief.code} ... `);
  const full = await fetchJson(`/learning-objectives/${id}`);
  const groups = collectGroups(full.progressionSections, [], []);
  const n = groups.reduce((acc, g) => acc + g.steps.length, 0);
  stepCount += n;
  objectives.push({
    id,
    code: full.code,
    name: full.name,
    domain: full.domain?.name,
    groups,
  });
  console.log(`${groups.length} groupes, ${n} étapes`);
}

objectives.sort((a, b) => a.code.localeCompare(b.code, "fr"));

const out = {
  source: "https://per.ciip.ch (API publique)",
  copyright: "© CIIP — Plan d'études romand. POC interne, usage commercial à clarifier.",
  fetchedAt: new Date().toISOString(),
  cycle: 2,
  years: [5, 6, 7, 8],
  objectives,
};

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "per.json"), JSON.stringify(out, null, 1));
console.log(`\nOK -> src/data/per.json (${objectives.length} objectifs, ${stepCount} étapes)`);
