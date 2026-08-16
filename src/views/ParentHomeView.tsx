import type { Route } from "../App";
import { globalStats } from "../lib/engine";
import { resetAll, setChild } from "../store";
import type { AppStore } from "../types";

const YEARS = [5, 6, 7, 8];

export function ParentHomeView({ store, go }: { store: AppStore; go: (r: Route) => void }) {
  const child = store.child!;
  const s = globalStats(store, child.year);

  return (
    <>
      <h1 className="hello">
        Espace parents — {child.name}, {child.year}P
      </h1>

      {s.seen === 0 && (
        <div className="card notice">
          <strong>Première étape : le positionnement.</strong> Indiquez dans le programme ce que{" "}
          {child.name} a déjà vu en classe cette année — les missions de révision ne testent que ces
          étapes.
        </div>
      )}

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-num">{s.seen}</span>
          <span className="kpi-label">étapes vues en classe (sur {s.total})</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{s.tested}</span>
          <span className="kpi-label">étapes testées</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{s.mastered}</span>
          <span className="kpi-label">étapes maîtrisées</span>
        </div>
      </div>

      <div className="tiles">
        <button className="card tile" onClick={() => go({ view: "programme" })}>
          <span className="tile-emoji">🗺️</span>
          <strong>Positionnement</strong>
          <span className="muted">
            Cocher ce qui a été vu en classe · {s.seen}/{s.total} étapes
          </span>
        </button>
        <button className="card tile" onClick={() => go({ view: "programme" })}>
          <span className="tile-emoji">👁️</span>
          <strong>Étapes à observer</strong>
          <span className="muted">
            Production, manipulation… à valider par vous · {s.validated}/{s.observe} validées
          </span>
        </button>
        <button className="card tile" onClick={() => go({ view: "dashboard" })}>
          <span className="tile-emoji">📊</span>
          <strong>Tableau de bord</strong>
          <span className="muted">Progression détaillée par objectif du PER</span>
        </button>
      </div>

      <div className="card profile-card">
        <h2>⚙️ Profil</h2>
        <div className="row">
          <span className="muted">Niveau actuel de {child.name} :</span>
          {YEARS.map((y) => (
            <button
              key={y}
              className={`year-chip ${child.year === y ? "selected" : ""}`}
              onClick={() => setChild(child.name, y)}
            >
              {y}P
            </button>
          ))}
        </div>
        <p className="muted small">
          Changer d'année conserve la progression : les étapes communes aux deux années gardent leur
          état.
        </p>
        <button
          className="btn danger"
          onClick={() => {
            if (window.confirm("Effacer le profil et toute la progression sur cet appareil ?")) resetAll();
          }}
        >
          Réinitialiser l'appareil
        </button>
      </div>
    </>
  );
}
