import type { Route } from "../App";
import { OBJECTIVES, objectiveStats } from "../lib/engine";
import { resetAll } from "../store";
import type { AppStore } from "../types";

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      <span className="bar-label">
        {value}/{max}
      </span>
    </div>
  );
}

export function DashboardView({ store, go }: { store: AppStore; go: (r: Route) => void }) {
  const year = store.child?.year ?? 6;
  const perObjective = OBJECTIVES.map((o) => ({ o, s: objectiveStats(store, o, year) })).filter(
    ({ s }) => s.total > 0
  );
  const totals = perObjective.reduce(
    (acc, { s }) => ({
      total: acc.total + s.total,
      seen: acc.seen + s.seen,
      tested: acc.tested + s.tested,
      mastered: acc.mastered + s.mastered,
    }),
    { total: 0, seen: 0, tested: 0, mastered: 0 }
  );

  return (
    <div className="dashboard">
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Retour
      </button>
      <h1>Espace parents</h1>
      <p className="muted">
        Progression {store.child ? `de ${store.child.name}` : ""} en {year}P, étape par étape sur le
        référentiel officiel du PER. Une étape est « maîtrisée » après deux bonnes réponses
        consécutives.
      </p>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-num">{totals.seen}</span>
          <span className="kpi-label">étapes vues en classe (sur {totals.total})</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{totals.tested}</span>
          <span className="kpi-label">étapes testées</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{totals.mastered}</span>
          <span className="kpi-label">étapes maîtrisées</span>
        </div>
      </div>

      {totals.seen === 0 && (
        <div className="card notice">
          <strong>Commencez par le positionnement :</strong> indiquez dans le programme ce qui a déjà
          été vu en classe cette année — c'est ce qui permet de cibler les missions.
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={() => go({ view: "programme" })}>
              🗺️ Ouvrir le programme
            </button>
          </div>
        </div>
      )}

      {perObjective.map(({ o, s }) => (
        <div className="card objective" key={o.id}>
          <div className="objective-head">
            <span className="per-chip big">{o.code}</span>
            <div>
              <h2>{o.name}</h2>
              <p className="muted">{o.domain}</p>
            </div>
          </div>
          <div className="bars">
            <div className="bar-row">
              <span className="bar-title">Vu en classe</span>
              <Bar value={s.seen} max={s.total} color="var(--accent)" />
            </div>
            <div className="bar-row">
              <span className="bar-title">Testé</span>
              <Bar value={s.tested} max={s.total} color="var(--francais)" />
            </div>
            <div className="bar-row">
              <span className="bar-title">Maîtrisé</span>
              <Bar value={s.mastered} max={s.total} color="var(--ok)" />
            </div>
          </div>
          <p className="muted small">
            {s.withQuestions} étapes sur {s.total} sont testables dans ce POC.
          </p>
        </div>
      ))}

      <p className="muted small">
        Source : Plan d'études romand © CIIP, API publique per.ciip.ch — POC, ne remplace pas
        l'évaluation scolaire officielle.
      </p>
      <button
        className="btn danger"
        onClick={() => {
          if (window.confirm("Effacer toute la progression enregistrée sur cet appareil ?")) resetAll();
        }}
      >
        Réinitialiser la progression
      </button>
    </div>
  );
}
