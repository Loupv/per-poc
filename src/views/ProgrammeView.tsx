import { useState } from "react";
import type { Route } from "../App";
import {
  OBJECTIVES,
  objectiveStats,
  stepHasQuestions,
  stepInYear,
  stepKind,
  stepStatus,
  type PerGroup,
  type PerObjective,
} from "../lib/engine";
import { setSeen, setValidated } from "../store";
import type { ChildProfile } from "../types";

const YEARS = [5, 6, 7, 8];

const MASTERY_CLASS = { untested: "none", fragile: "cur", mastered: "ok" } as const;
const MASTERY_LABEL = { untested: "non évalué", fragile: "fragile", mastered: "maîtrisé" } as const;

const groupLabel = (g: PerGroup) => {
  if (g.path.length) return g.path[g.path.length - 1];
  if (g.attentes.length) return g.attentes[0].text.slice(0, 80) + "…";
  return g.steps[0].text.slice(0, 80) + "…";
};

function GroupBlock({
  group,
  child,
  year,
  positioning,
  canEdit,
}: {
  group: PerGroup;
  child: ChildProfile;
  year: number;
  positioning: boolean;
  canEdit: boolean;
}) {
  const steps = group.steps.filter((s) => stepInYear(s, year));
  if (steps.length === 0) return null;
  const ids = steps.map((s) => s.id);
  const allSeen = ids.every((id) => child.seen[id]);
  const someSeen = ids.some((id) => child.seen[id]);

  return (
    <div className="prog-group">
      <div className="prog-group-head">
        {positioning && canEdit ? (
          <label className="seen-toggle">
            <input
              type="checkbox"
              checked={allSeen}
              ref={(el) => {
                if (el) el.indeterminate = !allSeen && someSeen;
              }}
              onChange={(e) => setSeen(child.id, ids, e.target.checked)}
            />
            <span>Vu en classe</span>
          </label>
        ) : positioning ? (
          <span className="seen-toggle muted">
            {allSeen ? "✓ vu en classe" : someSeen ? "en partie vu" : "pas encore vu"}
          </span>
        ) : (
          <span className="seen-toggle muted">tout testable</span>
        )}
        <span className="prog-group-label">{groupLabel(group)}</span>
      </div>
      <ul className="prog-steps">
        {steps.map((step) => {
          const m = stepStatus(child, step.id);
          return (
            <li key={step.id} className={`prog-step ${child.seen[step.id] || !positioning ? "" : "unseen"}`}>
              <span className={`mastery-dot ${MASTERY_CLASS[m]}`} title={MASTERY_LABEL[m]} />
              <span className="prog-step-text">{step.text}</span>
              {stepKind(step.id) === "observe" ? (
                canEdit ? (
                  <button
                    className={`badge observe ${child.validated[step.id] ? "validated" : ""}`}
                    title="Étape non testable en quizz (production, manipulation…) : un parent valide quand l'enfant sait le faire"
                    onClick={() => setValidated(child.id, step.id, !child.validated[step.id])}
                  >
                    {child.validated[step.id] ? "✓ validé" : "à observer"}
                  </button>
                ) : (
                  <span className={`badge observe ${child.validated[step.id] ? "validated" : ""}`}>
                    {child.validated[step.id] ? "✓ validé" : "à observer"}
                  </span>
                )
              ) : stepHasQuestions(step.id) ? (
                <span className="badge testable">testable</span>
              ) : (
                <span className="badge soon">bientôt</span>
              )}
              {positioning && canEdit && (
                <input
                  type="checkbox"
                  className="step-seen"
                  title="Vu en classe"
                  checked={!!child.seen[step.id]}
                  onChange={(e) => setSeen(child.id, [step.id], e.target.checked)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ObjectiveBlock({
  objective,
  child,
  year,
  positioning,
  canEdit,
}: {
  objective: PerObjective;
  child: ChildProfile;
  year: number;
  positioning: boolean;
  canEdit: boolean;
}) {
  const stats = objectiveStats(child, objective, year);
  if (stats.total === 0) return null;
  return (
    <details className="card objective prog-objective">
      <summary>
        <span className="per-chip big">{objective.code}</span>
        <span className="prog-obj-name">{objective.name}</span>
        <span className="prog-obj-stats muted">
          {positioning && `${stats.seen}/${stats.total} vues · `}
          {stats.mastered} <span className="mastery-dot ok inline" /> {stats.evaluated - stats.mastered}{" "}
          <span className="mastery-dot cur inline" /> · {stats.total} étapes
        </span>
      </summary>
      {positioning && canEdit && (
        <div className="row obj-bulk">
          <button
            className="btn ghost small-btn"
            onClick={() =>
              setSeen(
                child.id,
                objective.groups.flatMap((g) => g.steps.filter((s) => stepInYear(s, year)).map((s) => s.id)),
                true
              )
            }
          >
            Tout marquer vu
          </button>
          <button
            className="btn ghost small-btn"
            onClick={() =>
              setSeen(
                child.id,
                objective.groups.flatMap((g) => g.steps.filter((s) => stepInYear(s, year)).map((s) => s.id)),
                false
              )
            }
          >
            Tout décocher
          </button>
        </div>
      )}
      {objective.groups.map((g) => (
        <GroupBlock key={g.id} group={g} child={child} year={year} positioning={positioning} canEdit={canEdit} />
      ))}
      {objective.groups.some((g) => g.attentes.length > 0) && (
        <details className="attentes">
          <summary>Attentes fondamentales officielles de {objective.code}</summary>
          <ul>
            {[...new Map(objective.groups.flatMap((g) => g.attentes).map((a) => [a.id, a.text]))].map(
              ([id, text]) => (
                <li key={id}>{text}</li>
              )
            )}
          </ul>
        </details>
      )}
    </details>
  );
}

export function ProgrammeView({
  child,
  go,
  initialYear,
  canEdit,
}: {
  child: ChildProfile;
  go: (r: Route) => void;
  initialYear?: number;
  canEdit: boolean;
}) {
  const childYear = child.year;
  const [year, setYear] = useState(initialYear ?? childYear);
  const positioning = year === childYear;
  const domains = [...new Set(OBJECTIVES.map((o) => o.domain))];

  return (
    <div className="programme">
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Retour
      </button>
      <h1>Le programme, étape par étape</h1>
      <p className="muted">
        Toutes les progressions d'apprentissage officielles du PER.{" "}
        {positioning && canEdit ? (
          <>
            Pour l'année en cours ({childYear}P), cochez ce qui a <strong>déjà été vu en classe</strong> :
            les missions et contrôles ne portent que sur ces étapes.
          </>
        ) : positioning ? (
          <>Année en cours ({childYear}P). Le positionnement se fait dans l'espace parents.</>
        ) : (
          <>Année {year < childYear ? "précédente" : "à venir"} : tout le programme est consultable et testable.</>
        )}
      </p>

      <div className="row year-row">
        {YEARS.map((y) => (
          <button
            key={y}
            className={`year-chip ${year === y ? "selected" : ""}`}
            onClick={() => setYear(y)}
          >
            {y}P{y === childYear ? " ★" : ""}
          </button>
        ))}
      </div>

      <p className="muted small legend">
        <span className="mastery-dot none inline" /> non évalué ·{" "}
        <span className="mastery-dot cur inline" /> fragile ·{" "}
        <span className="mastery-dot ok inline" /> maîtrisé (contrôle réussi ou validation parent) ·
        « testable » = des questions existent déjà · « à observer » = production ou manipulation
      </p>

      {domains.map((d) => (
        <section key={d}>
          <h2 className="prog-domain">{d}</h2>
          {OBJECTIVES.filter((o) => o.domain === d).map((o) => (
            <ObjectiveBlock key={o.id} objective={o} child={child} year={year} positioning={positioning} canEdit={canEdit} />
          ))}
        </section>
      ))}
    </div>
  );
}
