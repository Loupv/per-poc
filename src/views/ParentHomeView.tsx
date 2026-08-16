import { useState } from "react";
import type { Route } from "../App";
import { StatusBar } from "../components/charts";
import {
  buildRevision,
  buildTest,
  DOMAIN_LABEL,
  domainStats,
  expressSelection,
  globalStats,
  questionById,
  recommendations,
  schoolYearFraction,
  stepInfo,
} from "../lib/engine";
import { hashPin, isValidPin, verifyPin } from "../lib/pin";
import { entitlements } from "../lib/plan";
import {
  addChild,
  deletePlannedTest,
  deleteRevision,
  planRevision,
  planTest,
  removeChild,
  resetAll,
  setActiveChild,
  setChildYear,
  setParentPinHash,
  setSeen,
} from "../store";
import type { AppStore, ChildProfile, Domain } from "../types";

const YEARS = [5, 6, 7, 8];
const DOMAINS: Domain[] = ["maths", "francais", "sciences", "shs"];

function AddChildForm({ childCount }: { childCount: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState(6);
  if (childCount >= entitlements.maxChildren) return null;
  if (!open)
    return (
      <button className="btn link" onClick={() => setOpen(true)}>
        + Ajouter un enfant
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

const fractionLabel = (f: number) => {
  if (f <= 0.02) return "pas encore commencé";
  if (f < 0.2) return "le tout début est vu";
  if (f < 0.4) return "environ un quart est vu";
  if (f < 0.6) return "environ la moitié est vue";
  if (f < 0.85) return "environ les trois quarts sont vus";
  if (f < 0.98) return "presque tout est vu";
  return "tout le programme est vu";
};

const LEVELS = [
  { f: 0, label: "—", title: "Pas encore commencé" },
  { f: 0.25, label: "¼", title: "Environ un quart du programme vu" },
  { f: 0.5, label: "½", title: "Environ la moitié du programme vue" },
  { f: 0.75, label: "¾", title: "Environ les trois quarts vus" },
  { f: 1, label: "Tout", title: "Tout le programme est vu" },
];

/** Une matière = un bloc : positionnement segmenté, état, actions. */
function MatiereBlock({ child, domain, go }: { child: ChildProfile; domain: Domain; go: (r: Route) => void }) {
  const s = domainStats(child, domain, child.year);
  const current = s.total === 0 ? 0 : (s.total - s.toPosition) / s.total;
  const date = new Date().toLocaleDateString("fr-CH");

  const commit = (f: number) => {
    const { see, unsee } = expressSelection(domain, child.year, f);
    setSeen(child.id, unsee, false);
    setSeen(child.id, see, true);
  };

  const testPreview = buildTest(child, domain);
  const revPreview = buildRevision(child, domain);

  return (
    <div className="matiere-block">
      <div className="row matiere-head">
        <span className={`domain-dot ${domain}`} />
        <strong className="matiere-name">{DOMAIN_LABEL[domain]}</strong>
        <span className="muted small express-value">{fractionLabel(current)}</span>
        <span className="segmented" role="group" aria-label={`Avancement en ${DOMAIN_LABEL[domain]}`}>
          {LEVELS.map(({ f, label, title }) => (
            <button
              key={f}
              className={Math.abs(current - f) <= 0.125 ? "on" : ""}
              title={title}
              onClick={() => commit(f)}
            >
              {label}
            </button>
          ))}
        </span>
      </div>
      <StatusBar stats={s} />
      <div className="row matiere-foot">
        <span className="muted small">
          {s.mastered} acquis · {s.inProgress} en cours · {s.toReview} à revoir
        </span>
        <span className="row matiere-links">
          {entitlements.canPlanTests && (
            <button
              className="btn link"
              disabled={testPreview.length === 0}
              onClick={() =>
                planTest(child.id, {
                  title: `Contrôle ${DOMAIN_LABEL[domain]} — ${date}`,
                  domain,
                  questionIds: testPreview.map((mq) => mq.question.id),
                })
              }
            >
              Contrôle
            </button>
          )}
          <button
            className="btn link"
            disabled={revPreview.length === 0}
            onClick={() =>
              planRevision(child.id, {
                title: `Révision ${DOMAIN_LABEL[domain]} — ${date}`,
                domain,
                questionIds: revPreview.map((mq) => mq.question.id),
              })
            }
          >
            Révision
          </button>
          <button className="btn link" onClick={() => go({ view: "programme" })}>
            Détail
          </button>
        </span>
      </div>
    </div>
  );
}

function PinSettings({ pinHash }: { pinHash: string | null }) {
  const [current, setCurrent] = useState("");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const clear = () => {
    setCurrent("");
    setPin1("");
    setPin2("");
  };

  const save = async () => {
    setMsg(null);
    if (pinHash && !(await verifyPin(current, pinHash))) return setMsg("Code actuel incorrect.");
    if (!isValidPin(pin1)) return setMsg("Le code doit faire 4 chiffres.");
    if (pin1 !== pin2) return setMsg("Les deux codes ne correspondent pas.");
    setParentPinHash(await hashPin(pin1));
    clear();
    setMsg("Code PIN enregistré ✓");
  };

  const remove = async () => {
    setMsg(null);
    if (pinHash && !(await verifyPin(current, pinHash))) return setMsg("Code actuel incorrect.");
    setParentPinHash(null);
    clear();
    setMsg("Code PIN supprimé.");
  };

  return (
    <div className="pin-settings">
      <p className="muted small">
        {pinHash
          ? "Un code PIN protège l'espace parents sur cet appareil."
          : "Aucun code PIN : n'importe qui peut ouvrir l'espace parents."}
      </p>
      <div className="row">
        {pinHash && (
          <input
            className="pin-input small"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Code actuel"
            value={current}
            onChange={(e) => setCurrent(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        )}
        <input
          className="pin-input small"
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="Nouveau code"
          value={pin1}
          onChange={(e) => setPin1(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <input
          className="pin-input small"
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="Confirmer"
          value={pin2}
          onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <button className="btn primary small-btn" onClick={save} disabled={pin1.length < 4}>
          {pinHash ? "Modifier" : "Définir"}
        </button>
        {pinHash && (
          <button className="btn link" onClick={remove} disabled={current.length < 4}>
            Supprimer
          </button>
        )}
      </div>
      {msg && (
        <p className={msg.includes("✓") || msg.includes("supprimé") ? "muted small" : "pin-error"}>{msg}</p>
      )}
    </div>
  );
}

/** Fautes agrégées par question : récurrence + dernière occurrence. */
function aggregateMistakes(child: ChildProfile) {
  const byQ = new Map<string, { count: number; lastAt: string; modes: Set<string>; stepId: number }>();
  for (const m of child.mistakes) {
    const cur = byQ.get(m.q) ?? { count: 0, lastAt: "", modes: new Set<string>(), stepId: m.s };
    cur.count++;
    if (m.at > cur.lastAt) cur.lastAt = m.at;
    cur.modes.add(m.mode);
    byQ.set(m.q, cur);
  }
  return [...byQ.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].lastAt.localeCompare(a[1].lastAt))
    .slice(0, 8);
}

function MistakesSection({ child }: { child: ChildProfile }) {
  const agg = aggregateMistakes(child);
  if (agg.length === 0) return null;
  const date = new Date().toLocaleDateString("fr-CH");
  const reviewIds = agg.map(([q]) => q).filter((q) => questionById(q));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Fautes récentes</h2>
        {reviewIds.length > 0 && (
          <button
            className="btn link"
            onClick={() =>
              planRevision(child.id, {
                title: `Révision des fautes — ${date}`,
                domain: "toutes",
                questionIds: reviewIds,
              })
            }
          >
            En faire une révision
          </button>
        )}
      </div>
      {agg.map(([qId, info]) => {
        const mq = questionById(qId);
        const step = stepInfo(info.stepId);
        return (
          <div className="mistake-row" key={qId}>
            <span className="mistake-text">
              {mq ? mq.question.prompt : qId}
              <span className="per-chip">{step?.objective.code}</span>
            </span>
            <span className="muted small mistake-meta">
              {info.count > 1 ? `ratée ${info.count}×` : "ratée 1×"} ·{" "}
              {info.modes.has("test") ? "en contrôle" : "à l'entraînement"} ·{" "}
              {new Date(info.lastAt).toLocaleDateString("fr-CH")}
            </span>
          </div>
        );
      })}
    </section>
  );
}

export function ParentHomeView({ store, child, go }: { store: AppStore; child: ChildProfile; go: (r: Route) => void }) {
  const reco = recommendations(child, 4);
  const g = globalStats(child, child.year);
  const calendarF = schoolYearFraction(new Date());
  const hasReco = reco.readyToTest.length > 0 || reco.toRework.length > 0 || reco.toPractice.length > 0;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const sessionsWeek = child.sessions.filter((s) => s.at >= weekAgo).length;

  return (
    <>
      <div className="row hello-row">
        <h1>Espace parents</h1>
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
      </div>
      <p className="muted small">
        {g.seen} étapes vues en classe · {g.evaluated} évaluées · {g.mastered} acquises — sur{" "}
        {g.total} en {child.year}P. {child.sessions.length} entraînement
        {child.sessions.length > 1 ? "s" : ""} effectué{child.sessions.length > 1 ? "s" : ""}
        {sessionsWeek > 0 && ` (${sessionsWeek} ces 7 derniers jours)`}.{" "}
        <button className="btn link" onClick={() => go({ view: "dashboard" })}>
          Tableau de bord
        </button>
      </p>

      <section className="card">
        <div className="card-head">
          <h2>L'itinéraire de l'année</h2>
          <button
            className="btn link"
            onClick={() => {
              for (const d of DOMAINS) {
                const { see, unsee } = expressSelection(d, child.year, calendarF);
                setSeen(child.id, unsee, false);
                setSeen(child.id, see, true);
              }
            }}
            title="Position habituelle à cette période de l'année scolaire"
          >
            Régler selon la période de l'année
          </button>
        </div>
        <p className="muted small">
          Préparez l'itinéraire : indiquez où en est la classe dans chaque matière — approximatif,
          ajustable à tout moment, affinable étape par étape dans le programme.
        </p>
        {DOMAINS.map((d) => (
          <MatiereBlock key={d} child={child} domain={d} go={go} />
        ))}
      </section>

      {(child.planned.length > 0 || child.revisions.length > 0) && (
        <section className="card">
          <h2>À faire par {child.name}</h2>
          {child.planned.map((p) => (
            <div className="row planned-row" key={p.id}>
              <span className="planned-title">
                {p.title}{" "}
                <span className="muted small">· contrôle · {p.questionIds.length} questions</span>
              </span>
              <button className="btn link" onClick={() => deletePlannedTest(child.id, p.id)}>
                Annuler
              </button>
            </div>
          ))}
          {child.revisions.map((p) => (
            <div className="row planned-row" key={p.id}>
              <span className="planned-title">
                {p.title}{" "}
                <span className="muted small">· révision · {p.questionIds.length} questions</span>
              </span>
              <button className="btn link" onClick={() => deleteRevision(child.id, p.id)}>
                Retirer
              </button>
            </div>
          ))}
        </section>
      )}

      <MistakesSection child={child} />

      {entitlements.canSeeRecommendations && hasReco && (
        <section className="card">
          <h2>Recommandations</h2>
          {reco.readyToTest.length > 0 && (
            <div className="reco-block">
              <h3>Prêt à être contrôlé</h3>
              <ul>
                {reco.readyToTest.map((i) => (
                  <li key={i.step.id}>
                    {i.step.text.slice(0, 90)} <span className="per-chip">{i.objective.code}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reco.toRework.length > 0 && (
            <div className="reco-block">
              <h3>À retravailler</h3>
              <ul>
                {reco.toRework.map((i) => (
                  <li key={i.step.id}>
                    {i.step.text.slice(0, 90)} <span className="per-chip">{i.objective.code}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reco.toPractice.length > 0 && (
            <div className="reco-block">
              <h3>À réviser</h3>
              <ul>
                {reco.toPractice.map((i) => (
                  <li key={i.step.id}>
                    {i.step.text.slice(0, 90)} <span className="per-chip">{i.objective.code}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {child.tests.length > 0 && (
        <section className="card">
          <h2>Contrôles passés</h2>
          <table className="results-table">
            <tbody>
              {[...child.tests].reverse().map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td className="muted">{new Date(t.at).toLocaleDateString("fr-CH")}</td>
                  <td>
                    <strong>
                      {t.score}/{t.total}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <details className="card profile-details">
        <summary>Profil et réglages</summary>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="muted">Niveau de {child.name} :</span>
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
        <PinSettings pinHash={store.parentPinHash} />
        <div className="row" style={{ marginTop: 10 }}>
          {store.children.length > 1 && (
            <button
              className="btn link danger-link"
              onClick={() => {
                if (window.confirm(`Supprimer le profil de ${child.name} et toute sa progression ?`))
                  removeChild(child.id);
              }}
            >
              Supprimer ce profil
            </button>
          )}
          <button
            className="btn link danger-link"
            onClick={() => {
              if (window.confirm("Effacer TOUS les profils et toute la progression sur cet appareil ?"))
                resetAll();
            }}
          >
            Réinitialiser l'appareil
          </button>
        </div>
      </details>
    </>
  );
}
