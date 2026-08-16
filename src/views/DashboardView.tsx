import type { Route } from "../App";
import { THEMES } from "../data/content";
import per from "../data/per.json";
import { resetAll, themeStatus } from "../store";
import type { AppStore } from "../types";

interface PerObjective {
  code: string;
  name: string;
  domain: string;
  progressions: { learnings: { text: string; years: number[] }[]; attentes: string[] }[];
}

const PER_OBJECTIVES = (per as { objectives: PerObjective[] }).objectives;

const attentesFor = (code: string): string[] => {
  const obj = PER_OBJECTIVES.find((o) => o.code === code);
  if (!obj) return [];
  const out: string[] = [];
  for (const p of obj.progressions)
    for (const a of p.attentes) if (!out.includes(a)) out.push(a);
  return out;
};

const STATUS_LABEL = { none: "Non travaillé", started: "En cours", mastered: "Maîtrisé" } as const;

export function DashboardView({ store, go }: { store: AppStore; go: (r: Route) => void }) {
  const codes = [...new Set(THEMES.map((t) => t.perCode))];
  const mastered = THEMES.filter((t) => themeStatus(store.results[t.id]) === "mastered").length;
  const started = THEMES.filter((t) => themeStatus(store.results[t.id]) === "started").length;

  return (
    <div className="dashboard">
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Retour
      </button>
      <h1>Espace parents</h1>
      <p className="muted">
        Progression {store.child ? `de ${store.child}` : ""} en 6P, par objectif du Plan d'études
        romand (PER). Un thème est « maîtrisé » à partir de 80% de bonnes réponses.
      </p>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-num">{mastered}</span>
          <span className="kpi-label">thèmes maîtrisés</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{started}</span>
          <span className="kpi-label">en cours</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{THEMES.length - mastered - started}</span>
          <span className="kpi-label">à travailler</span>
        </div>
      </div>

      {codes.map((code) => {
        const obj = PER_OBJECTIVES.find((o) => o.code === code);
        const themes = THEMES.filter((t) => t.perCode === code);
        const attentes = attentesFor(code);
        return (
          <div className="card objective" key={code}>
            <div className="objective-head">
              <span className="per-chip big">{code}</span>
              <div>
                <h2>{obj?.name ?? code}</h2>
                <p className="muted">{obj?.domain}</p>
              </div>
            </div>

            <table className="results-table">
              <thead>
                <tr>
                  <th>Thème travaillé dans l'app</th>
                  <th>Meilleur score</th>
                  <th>Essais</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {themes.map((t) => {
                  const r = store.results[t.id];
                  const s = themeStatus(r);
                  return (
                    <tr key={t.id}>
                      <td>
                        {t.emoji} {t.title}
                      </td>
                      <td>{r ? `${r.best}/${r.total}` : "—"}</td>
                      <td>{r?.attempts ?? 0}</td>
                      <td>
                        <span className={`status status-${s}`}>{STATUS_LABEL[s]}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {attentes.length > 0 && (
              <details className="attentes">
                <summary>
                  Attentes fondamentales officielles du PER ({attentes.length}) — texte intégral
                </summary>
                <ul>
                  {attentes.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}

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
