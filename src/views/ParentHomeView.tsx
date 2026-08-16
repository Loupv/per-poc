import { useState } from "react";
import type { Route } from "../App";
import { buildTest, DOMAIN_LABEL, globalStats, recommendations } from "../lib/engine";
import { entitlements, TIER_LABEL, tierFor } from "../lib/plan";
import {
  addChild,
  deletePlannedTest,
  planTest,
  removeChild,
  resetAll,
  setActiveChild,
  setChildYear,
} from "../store";
import type { AppStore, ChildProfile, Domain } from "../types";

const YEARS = [5, 6, 7, 8];
const DOMAINS: (Domain | "toutes")[] = ["toutes", "maths", "francais", "sciences", "shs"];

function AddChildForm({ childCount }: { childCount: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState(6);
  // Précâblage abonnement : le multi-enfants relève du tier Famille
  if (childCount >= entitlements.maxChildren)
    return (
      <span className="tier-badge" title="Disponible avec l'abonnement Famille">
        ✦ Multi-enfants : tier {TIER_LABEL[tierFor((e) => e.maxChildren > 1)]}
      </span>
    );
  if (!open)
    return (
      <button className="btn ghost" onClick={() => setOpen(true)}>
        + Ajouter un enfant{" "}
        <span className="tier-badge inline">✦ {TIER_LABEL[tierFor((e) => e.maxChildren > 1)]}</span>
      </button>
    );
  return (
    <form
      className="row add-child"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) {
          addChild(name.trim(), year);
          setName("");
          setOpen(false);
        }
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom" autoFocus />
      {YEARS.map((y) => (
        <button
          key={y}
          type="button"
          className={`year-chip ${year === y ? "selected" : ""}`}
          onClick={() => setYear(y)}
        >
          {y}P
        </button>
      ))}
      <button className="btn primary" type="submit" disabled={!name.trim()}>
        Créer
      </button>
    </form>
  );
}

function PlanTestForm({ child }: { child: ChildProfile }) {
  const [domain, setDomain] = useState<Domain | "toutes">("toutes");
  const preview = buildTest(child, domain);
  // Précâblage abonnement : la planification de contrôles relève du tier Plus
  if (!entitlements.canPlanTests)
    return (
      <div className="card">
        <h2>📝 Planifier un contrôle</h2>
        <p className="muted">
          Disponible avec l'abonnement {TIER_LABEL[tierFor((e) => e.canPlanTests)]}.
        </p>
      </div>
    );
  return (
    <div className="card">
      <h2>
        📝 Planifier un contrôle{" "}
        <span className="tier-badge inline">✦ {TIER_LABEL[tierFor((e) => e.canPlanTests)]}</span>
      </h2>
      <p className="muted">
        Les questions sont choisies dans les étapes vues en classe, en privilégiant ce qui est bien
        entraîné mais jamais contrôlé. Elles sont figées à la planification.
      </p>
      <div className="row">
        {DOMAINS.map((d) => (
          <button
            key={d}
            className={`year-chip ${domain === d ? "selected" : ""}`}
            onClick={() => setDomain(d)}
          >
            {d === "toutes" ? "Toutes matières" : DOMAIN_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button
          className="btn primary"
          disabled={preview.length === 0}
          onClick={() => {
            const label = domain === "toutes" ? "toutes matières" : DOMAIN_LABEL[domain];
            planTest(child.id, {
              title: `Contrôle ${label} — ${new Date().toLocaleDateString("fr-CH")}`,
              domain,
              questionIds: preview.map((mq) => mq.question.id),
            });
          }}
        >
          Planifier ({preview.length} questions)
        </button>
        {preview.length === 0 && (
          <span className="muted small">
            Aucune question disponible — faites d'abord le positionnement.
          </span>
        )}
      </div>
      {child.planned.length > 0 && (
        <div className="planned-list">
          <h3>En attente</h3>
          {child.planned.map((p) => (
            <div className="row planned-row" key={p.id}>
              <span className="planned-title">
                {p.title} <span className="muted small">· {p.questionIds.length} questions</span>
              </span>
              <button className="btn ghost small-btn" onClick={() => deletePlannedTest(child.id, p.id)}>
                Annuler
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ParentHomeView({ store, child, go }: { store: AppStore; child: ChildProfile; go: (r: Route) => void }) {
  const s = globalStats(child, child.year);
  const reco = recommendations(child);

  return (
    <>
      <h1 className="hello">Espace parents</h1>

      <div className="row child-switch">
        {store.children.map((c) => (
          <button
            key={c.id}
            className={`year-chip ${c.id === child.id ? "selected" : ""}`}
            onClick={() => setActiveChild(c.id)}
          >
            {c.name} · {c.year}P
          </button>
        ))}
        <AddChildForm childCount={store.children.length} />
      </div>

      {s.seen === 0 && (
        <div className="card notice">
          <strong>Première étape : le positionnement.</strong> Indiquez dans le programme ce que{" "}
          {child.name} a déjà vu en classe cette année.
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={() => go({ view: "programme" })}>
              🗺️ Ouvrir le programme
            </button>
          </div>
        </div>
      )}

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-num">{s.seen}</span>
          <span className="kpi-label">étapes vues en classe (sur {s.total})</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{s.evaluated}</span>
          <span className="kpi-label">évaluées (contrôle ou validation)</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{s.mastered}</span>
          <span className="kpi-label">maîtrisées</span>
        </div>
      </div>

      <div className="card">
        <h2>
          💡 Recommandations pour {child.name}{" "}
          <span className="tier-badge inline">
            ✦ {TIER_LABEL[tierFor((e) => e.canSeeRecommendations)]}
          </span>
        </h2>
        {!entitlements.canSeeRecommendations ? (
          <p className="muted">
            Disponible avec l'abonnement {TIER_LABEL[tierFor((e) => e.canSeeRecommendations)]}.
          </p>
        ) : reco.readyToTest.length === 0 && reco.toRework.length === 0 && reco.toPractice.length === 0 ? (
          <p className="muted">
            Rien à signaler pour l'instant. Les recommandations apparaissent après le positionnement
            et les premiers entraînements.
          </p>
        ) : (
          <>
            {reco.readyToTest.length > 0 && (
              <div className="reco-block">
                <h3>✅ Prêt à être contrôlé (bien entraîné, jamais évalué)</h3>
                <ul>
                  {reco.readyToTest.map((i) => (
                    <li key={i.step.id}>
                      {i.step.text.slice(0, 100)} <span className="per-chip">{i.objective.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reco.toRework.length > 0 && (
              <div className="reco-block">
                <h3>🔁 À retravailler (raté au dernier contrôle)</h3>
                <ul>
                  {reco.toRework.map((i) => (
                    <li key={i.step.id}>
                      {i.step.text.slice(0, 100)} <span className="per-chip">{i.objective.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reco.toPractice.length > 0 && (
              <div className="reco-block">
                <h3>🎯 À réviser (vu en classe, jamais entraîné)</h3>
                <ul>
                  {reco.toPractice.map((i) => (
                    <li key={i.step.id}>
                      {i.step.text.slice(0, 100)} <span className="per-chip">{i.objective.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <PlanTestForm child={child} />

      {child.tests.length > 0 && (
        <div className="card">
          <h2>📈 Contrôles passés</h2>
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
          <p className="muted small">
            Les résultats de contrôle sont enregistrés en une fois et ne peuvent pas être modifiés ni
            repassés. Détail par objectif dans le{" "}
            <button className="linklike" onClick={() => go({ view: "dashboard" })}>
              tableau de bord
            </button>
            .
          </p>
        </div>
      )}

      <div className="tiles">
        <button className="card tile" onClick={() => go({ view: "programme" })}>
          <span className="tile-emoji">🗺️</span>
          <strong>Positionnement & étapes à observer</strong>
          <span className="muted">
            {s.seen}/{s.total} vues · {s.validated}/{s.observe} validées
          </span>
        </button>
        <button className="card tile" onClick={() => go({ view: "dashboard" })}>
          <span className="tile-emoji">📊</span>
          <strong>Tableau de bord</strong>
          <span className="muted">Progression détaillée par objectif du PER</span>
        </button>
      </div>

      <div className="card profile-card">
        <h2>⚙️ Profil de {child.name}</h2>
        <div className="row">
          <span className="muted">Niveau actuel :</span>
          {YEARS.map((y) => (
            <button
              key={y}
              className={`year-chip ${child.year === y ? "selected" : ""}`}
              onClick={() => setChildYear(child.id, y)}
            >
              {y}P
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          {store.children.length > 1 && (
            <button
              className="btn danger"
              onClick={() => {
                if (window.confirm(`Supprimer le profil de ${child.name} et toute sa progression ?`))
                  removeChild(child.id);
              }}
            >
              Supprimer ce profil
            </button>
          )}
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm("Effacer TOUS les profils et toute la progression sur cet appareil ?"))
                resetAll();
            }}
          >
            Réinitialiser l'appareil
          </button>
        </div>
      </div>
    </>
  );
}
