import type { Route } from "../App";
import { Donut, ScoreLine, StatusBar } from "../components/charts";
import {
  DOMAIN_LABEL,
  domainStats,
  OBJECTIVES,
  objectiveBreakdown,
  objectiveDomain,
} from "../lib/engine";
import type { ChildProfile, Domain } from "../types";

const DOMAINS: Domain[] = ["maths", "francais", "sciences", "shs"];

export function DashboardView({ child, go }: { child: ChildProfile; go: (r: Route) => void }) {
  const year = child.year;

  return (
    <div className="dashboard">
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Retour
      </button>
      <h1>
        Tableau de bord — {child.name}, {year}P
      </h1>
      <p className="muted">
        Progression officielle sur le référentiel du PER. « Acquis » = dernier contrôle réussi ou
        étape validée par un parent ; l'entraînement libre n'est pas comptabilisé.
      </p>

      {child.tests.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Scores aux contrôles</h2>
            <span className="muted small">{child.tests.length} contrôle{child.tests.length > 1 ? "s" : ""}</span>
          </div>
          <ScoreLine
            points={child.tests.map((t) => ({
              label: `${t.title} (${new Date(t.at).toLocaleDateString("fr-CH")})`,
              pct: Math.round((t.score / t.total) * 100),
            }))}
          />
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

      {DOMAINS.map((d) => {
        const ds = domainStats(child, d, year);
        if (ds.total === 0) return null;
        const objectives = OBJECTIVES.filter((o) => objectiveDomain(o.code) === d);
        return (
          <div className="card domain-section-card" key={d}>
            <div className="domain-stats-head">
              <Donut stats={ds} />
              <div className="domain-stats-info">
                <h2>
                  <span className={`domain-dot ${d}`} /> {DOMAIN_LABEL[d]}
                </h2>
                <p className="muted small">
                  {ds.total} étapes en {year}P : {ds.mastered} acquises · {ds.inProgress} en cours ·{" "}
                  {ds.toReview} à revoir · {ds.toPosition} à positionner
                </p>
              </div>
            </div>
            {objectives.map((o) => {
              const s = objectiveBreakdown(child, o, year);
              if (s.total === 0) return null;
              return (
                <div className="obj-stat-row" key={o.id}>
                  <div className="obj-stat-head">
                    <span className="per-chip">{o.code}</span>
                    <span className="obj-stat-name">{o.name}</span>
                    <span className="muted small obj-stat-counts">
                      {s.mastered}/{s.total} acquis
                    </span>
                  </div>
                  <StatusBar stats={s} height={7} />
                </div>
              );
            })}
          </div>
        );
      })}

      <p className="muted small legend-line">
        <span className="seg-dot ok" /> acquis · <span className="seg-dot cur" /> en cours ·{" "}
        <span className="seg-dot ko" /> à revoir · gris = à positionner
      </p>
      <p className="muted small">
        Source : Plan d'études romand © CIIP, API publique per.ciip.ch — POC, ne remplace pas
        l'évaluation scolaire officielle.
      </p>
    </div>
  );
}
