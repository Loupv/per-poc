// Ingestion du Plan d'études romand depuis l'API publique per.ciip.ch
// Cible POC : cycle 2, année 6P, domaines Mathématiques (MSN 21-25) et Français (L1 21-28).
// Sortie : src/data/per.json
//
// NOTE légale : données © CIIP — usage commercial à clarifier avec la CIIP avant tout lancement.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://per.ciip.ch/api";
const TARGET_YEAR = 6;
const CODE_PREFIXES = ["MSN 21", "MSN 22", "MSN 23", "MSN 24", "MSN 25", "L1 2"];

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

// Aplatit l'arbre progressionSections -> progressions -> {learnings, fundamentalExpectations}
function collectProgressions(sections, out = []) {
  for (const s of sections ?? []) {
    for (const prog of s.progressions ?? []) {
      const learnings = (prog.learnings ?? [])
        .map((l) => ({ text: stripHtml(l.content?.html), years: yearsOf(l.yearDistributions) }))
        .filter((l) => l.text && !/^Manuels \d/.test(l.text));
      const attentes = (prog.fundamentalExpectations ?? [])
        .map((fe) => stripHtml(fe.content?.html))
        .filter(Boolean);
      if (learnings.length || attentes.length) out.push({ learnings, attentes });
    }
    collectProgressions(s.children, out);
  }
  return out;
}

const cycle2 = await fetchJson("/cycles/2");
const targets = new Map(); // dédoublonne par id (MSN 25 apparaît deux fois dans la liste)
for (const lo of cycle2.learningObjectives) {
  if (CODE_PREFIXES.some((p) => lo.code.startsWith(p))) targets.set(lo.id, lo);
}

const objectives = [];
for (const [id, brief] of targets) {
  process.stdout.write(`  ${brief.code} ... `);
  const full = await fetchJson(`/learning-objectives/${id}`);
  const progressions = collectProgressions(full.progressionSections);

  // Ne garder que ce qui concerne l'année cible ; les attentes d'une progression
  // sont conservées dès qu'au moins un apprentissage de la progression touche la 6e.
  const kept = progressions
    .map((p) => ({
      learnings: p.learnings.filter((l) => l.years.includes(TARGET_YEAR) || l.years.length === 0),
      attentes: p.attentes,
    }))
    .filter((p) => p.learnings.length > 0)
    .map((p) => ({ ...p, attentes: [...new Set(p.attentes)] }));

  objectives.push({
    id,
    code: full.code,
    name: full.name,
    domain: full.domain?.name,
    thematicAxes: (full.thematicAxes ?? []).map((a) => a.name),
    progressions: kept,
  });
  console.log(`${kept.length} progressions retenues`);
}

objectives.sort((a, b) => a.code.localeCompare(b.code, "fr"));

const out = {
  source: "https://per.ciip.ch (API publique)",
  copyright: "© CIIP — Plan d'études romand. POC interne, usage commercial à clarifier.",
  fetchedAt: new Date().toISOString(),
  cycle: 2,
  targetYear: TARGET_YEAR,
  objectives,
};

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "per.json"), JSON.stringify(out, null, 1));
console.log(`\nOK -> src/data/per.json (${objectives.length} objectifs)`);
