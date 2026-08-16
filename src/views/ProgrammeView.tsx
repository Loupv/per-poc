import { useState } from "react";
import type { Route } from "../App";
import {
  OBJECTIVES,
  objectiveStats,
  stepHasQuestions,
  stepInYear,
  stepKind,
  stepMastery,
  type PerGroup,
  type PerObjective,
} from "../lib/engine";
import { setSeen, setValidated } from "../store";
import type { AppStore } from "../types";

const YEARS = [5, 6, 7, 8];

const MASTERY_ICON = { untested: "⚪", fragile: "🟡", mastered: "🟢" } as const;
const MASTERY_LABEL = { untested: "non testé", fragile: "fragile", mastered: "maîtrisé" } as const;

const groupLabel = (g: PerGroup) => {
  if (g.path.length) return g.path[g.path.length - 1];
  if (g.attentes.length) return g.attentes[0].text.slice(0, 80) + "…";
  return g.steps[0].text.slice(0, 80) + "…";
};

function GroupBlock({
  group,
  store,
  year,
  positioning,
}: {
  group: PerGroup;
  store: AppStore;
  year: number;
  positioning: boolean;
}) {
  const steps = group.steps.filter((s) => stepInYear(s, year));
  if (steps.length === 0) return null;
  const ids = steps.map((s) => s.id);
  const allSeen = ids.every((id) => store.seen[id]);
  const someSeen = ids.some((id) => store.seen[id]);

  return (
    <div className="prog-group">
      <div className="prog-group-head">
        {positioning ? (
          <label className="seen-toggle">
            <input
              type="checkbox"
              checked={allSeen}
              ref={(el) => {
                if (el) el.indeterminate = !allSeen && someSeen;
              }}
              onChange={(e) => setSeen(ids, e.target.checked)}
            />
            <span>Vu en classe</span>
          </label>
        ) : (
          <span className="seen-toggle muted">tout testable</span>
        )}
        <span className="prog-group-label">{groupLabel(group)}</span>
      </div>
      <ul className="prog-steps">
        {steps.map((step) => {
          const m = stepMastery(store, step.id);
          return (
            <li key={step.id} className={`prog-step ${store.seen[step.id] || !positioning ? "" : "unseen"}`}>
              <span className="mastery" title={MASTERY_LABEL[m]}>
                {MASTERY_ICON[m]}
              </span>
              <span className="prog-step-text">{step.text}</span>
              {stepKind(step.id) === "observe" ? (
                <button
                  className={`badge observe ${store.validated[step.id] ? "validated" : ""}`}
                  title="Étape non testable en quizz (production, manipulation…) : un parent valide quand l'enfant sait le faire"
                  onClick={() => setValidated(step.id, !store.validated[step.id])}
                >
                  {store.validated[step.id] ? "✓ validé" : "à observer"}
                </button>
              ) : stepHasQuestions(step.id) ? (
                <span className="badge testable">testable</span>
              ) : (
                <span className="badge soon">bientôt</span>
              )}
              {positioning && (
                <input
                  type="checkbox"
                  className="step-seen"
                  title="Vu en classe"
                  checked={!!store.seen[step.id]}
                  onChange={(e) => setSeen([step.id], e.target.checked)}
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
  store,
  year,
  positioning,
}: {
  objective: PerObjective;
  store: AppStore;
  year: number;
  positioning: boolean;
}) {
  const stats = objectiveStats(store, objective, year);
  if (stats.total === 0) return null;
  return (
    <details className="card objective prog-objective">
      <summary>
        <span className="per-chip big">{objective.code}</span>
        <span className="prog-obj-name">{objective.name}</span>
        <span className="prog-obj-stats muted">
          {positioning && `${stats.seen}/${stats.total} vues · `}
          {stats.mastered}🟢 {stats.tested - stats.mastered}🟡 · {stats.total} étapes
        </span>
      </summary>
      {positioning && (
        <div className="row obj-bulk">
          <button
            className="btn ghost small-btn"
            onClick={() =>
              setSeen(
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
        <GroupBlock key={g.id} group={g} store={store} year={year} positioning={positioning} />
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
  store,
  go,
  initialYear,
}: {
  store: AppStore;
  go: (r: Route) => void;
  initialYear?: number;
}) {
  const childYear = store.child?.year ?? 6;
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
        {positioning ? (
          <>
            Pour l'année en cours ({childYear}P), cochez ce qui a <strong>déjà été vu en classe</strong> :
            les missions ne testent que ces étapes.
          </>
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
        ⚪ non testé · 🟡 fragile · 🟢 maîtrisé · « testable » = des questions existent déjà dans le
        POC · « à observer » = production ou manipulation, cliquez pour valider quand l'enfant sait
        le faire
      </p>

      {domains.map((d) => (
        <section key={d}>
          <h2 className="prog-domain">{d}</h2>
          {OBJECTIVES.filter((o) => o.domain === d).map((o) => (
            <ObjectiveBlock key={o.id} objective={o} store={store} year={year} positioning={positioning} />
          ))}
        </section>
      ))}
    </div>
  );
}
