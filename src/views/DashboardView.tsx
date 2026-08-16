import type { Route } from "../App";
import { OBJECTIVES, objectiveStats } from "../lib/engine";
import type { ChildProfile } from "../types";

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

export function DashboardView({ child, go }: { child: ChildProfile; go: (r: Route) => void }) {
  const year = child.year;
  const perObjective = OBJECTIVES.map((o) => ({ o, s: objectiveStats(child, o, year) })).filter(
    ({ s }) => s.total > 0
  );

  return (
    <div className="dashboard">
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Retour
      </button>
      <h1>Tableau de bord — {child.name}, {year}P</h1>
      <p className="muted">
        Progression officielle par objectif du PER. « Évalué » = contrôlé ou validé par un parent ;
        « maîtrisé » = dernier contrôle réussi ou étape validée. L'entraînement libre de {child.name}{" "}
        n'est pas comptabilisé ici.
      </p>

      {child.tests.length > 0 && (
        <div className="card">
          <h2>📈 Historique des contrôles</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Contrôle</th>
                <th>Date</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {[...child.tests].reverse().map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{new Date(t.at).toLocaleDateString("fr-CH")}</td>
                  <td>
                    <strong>
                      {t.score}/{t.total}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <span className="bar-title">Évalué</span>
              <Bar value={s.evaluated} max={s.total} color="var(--francais)" />
            </div>
            <div className="bar-row">
              <span className="bar-title">Maîtrisé</span>
              <Bar value={s.mastered} max={s.total} color="var(--ok)" />
            </div>
          </div>
          <p className="muted small">
            {s.withQuestions} étapes sur {s.total} sont testables en quizz dans ce POC
            {s.observe > 0 &&
              ` · ${s.observe} étapes « à observer », dont ${s.validated} validées par un parent`}
            .
          </p>
        </div>
      ))}

      <p className="muted small">
        Source : Plan d'études romand © CIIP, API publique per.ciip.ch — POC, ne remplace pas
        l'évaluation scolaire officielle.
      </p>
    </div>
  );
}
