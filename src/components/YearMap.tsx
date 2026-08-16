// La carte de l'année : chaque point est une étape du programme. Elle s'allume
// au fil de la progression — c'est la seule « récompense » affichée, ni points
// ni badges, juste le territoire qui se révèle.

import { DOMAIN_LABEL, OBJECTIVES, objectiveDomain, stepInYear, stepStatus, practiceLevel } from "../lib/engine";
import type { ChildProfile, Domain } from "../types";

const DOMAINS: Domain[] = ["maths", "francais", "sciences", "shs"];

export function YearMap({ child, workedStepIds }: { child: ChildProfile; workedStepIds?: Set<number> }) {
  return (
    <div className="yearmap">
      {DOMAINS.map((d) => {
        const steps = OBJECTIVES.filter((o) => objectiveDomain(o.code) === d).flatMap((o) =>
          o.groups.flatMap((g) => g.steps.filter((s) => stepInYear(s, child.year)))
        );
        if (steps.length === 0) return null;
        return (
          <div className="yearmap-row" key={d}>
            <span className="yearmap-label muted small">{DOMAIN_LABEL[d]}</span>
            <span className="yearmap-dots">
              {steps.map((s) => {
                const official = stepStatus(child, s.id);
                const trained = practiceLevel(child, s.id);
                const lit = official === "mastered" || trained === "mastered";
                const touched = official !== "untested" || trained !== "untested" || child.seen[s.id];
                const worked = workedStepIds?.has(s.id);
                return (
                  <span
                    key={s.id}
                    className={`ydot ${d} ${lit ? "lit" : touched ? "touched" : ""} ${worked ? "worked" : ""}`}
                    title={s.text.slice(0, 80)}
                  />
                );
              })}
            </span>
          </div>
        );
      })}
      <p className="muted small yearmap-caption">
        Chaque point est une étape du programme de {child.year}P — ta carte s'allume au fil de
        l'année.
      </p>
    </div>
  );
}
