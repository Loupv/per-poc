import { useState } from "react";
import type { Route } from "../App";
import { StatusBar } from "../components/charts";
import {
  buildRevision,
  buildTest,
  DOMAIN_LABEL,
  domainStats,
  expressSelection,
  recommendations,
  schoolYearFraction,
} from "../lib/engine";
import { hashPin, isValidPin, verifyPin } from "../lib/pin";
import { entitlements, TIER_LABEL, tierFor } from "../lib/plan";
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
  if (childCount >= entitlements.maxChildren)
    return (
      <span className="tier-badge" title="Disponible avec l'abonnement Famille">
        Multi-enfants : tier {TIER_LABEL[tierFor((e) => e.maxChildren > 1)]}
      </span>
    );
  if (!open)
    return (
      <button className="btn ghost small-btn" onClick={() => setOpen(true)}>
        + Ajouter un enfant <span className="tier-badge inline">{TIER_LABEL[tierFor((e) => e.maxChildren > 1)]}</span>
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

/** Ligne matière : états + actions directes. */
function DomainRow({ child, domain, go }: { child: ChildProfile; domain: Domain; go: (r: Route) => void }) {
  const s = domainStats(child, domain, child.year);
  const testPreview = buildTest(child, domain);
  const revPreview = buildRevision(child, domain);
  const date = new Date().toLocaleDateString("fr-CH");

  return (
    <div className="matiere-row">
      <div className="matiere-head">
        <span className={`domain-dot ${domain}`} />
        <strong className="matiere-name">{DOMAIN_LABEL[domain]}</strong>
        <span className="matiere-counts muted">
          {s.mastered} acquis · {s.inProgress} en cours · {s.toReview} à revoir · {s.toPosition} à
          positionner
        </span>
      </div>
      <StatusBar stats={s} />
      <div className="row matiere-actions">
        {entitlements.canPlanTests && (
          <button
            className="btn ghost small-btn"
            disabled={testPreview.length === 0}
            onClick={() =>
              planTest(child.id, {
                title: `Contrôle ${DOMAIN_LABEL[domain]} — ${date}`,
                domain,
                questionIds: testPreview.map((mq) => mq.question.id),
              })
            }
          >
            Programmer un contrôle
          </button>
        )}
        <button
          className="btn ghost small-btn"
          disabled={revPreview.length === 0}
          onClick={() =>
            planRevision(child.id, {
              title: `Révision ${DOMAIN_LABEL[domain]} — ${date}`,
              domain,
              questionIds: revPreview.map((mq) => mq.question.id),
            })
          }
        >
          Programme de révision
        </button>
        <button className="btn ghost small-btn" onClick={() => go({ view: "programme" })}>
          Positionner
        </button>
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
      <h3>Code PIN parent</h3>
      <p className="muted small">
        {pinHash
          ? "Un code protège l'accès à l'espace parents sur cet appareil."
          : "Aucun code : n'importe qui peut ouvrir l'espace parents. Définissez un code à 4 chiffres."}
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
          {pinHash ? "Modifier" : "Définir le code"}
        </button>
        {pinHash && (
          <button className="btn ghost small-btn" onClick={remove} disabled={current.length < 4}>
            Supprimer le code
          </button>
        )}
      </div>
      {msg && <p className={msg.includes("incorrect") || msg.includes("correspondent") || msg.includes("chiffres") ? "pin-error" : "muted small"}>{msg}</p>}
    </div>
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

/** Un curseur par matière : glisser = « où en est la classe ». */
function ExpressSlider({ child, domain }: { child: ChildProfile; domain: Domain }) {
  const s = domainStats(child, domain, child.year);
  const current = s.total === 0 ? 0 : (s.total - s.toPosition) / s.total;
  const [value, setValue] = useState<number | null>(null);
  const shown = value ?? current;

  const commit = (f: number) => {
    const { see, unsee } = expressSelection(domain, child.year, f);
    setSeen(child.id, unsee, false);
    setSeen(child.id, see, true);
    setValue(null);
  };

  return (
    <div className="express-row" key={domain}>
      <div className="row express-head">
        <span className={`domain-dot ${domain}`} />
        <span className="express-name">{DOMAIN_LABEL[domain]}</span>
        <span className="muted small express-value">{fractionLabel(shown)}</span>
      </div>
      <input
        type="range"
        className="express-slider"
        min={0}
        max={100}
        step={5}
        value={Math.round(shown * 100)}
        aria-label={`Avancement en ${DOMAIN_LABEL[domain]}`}
        onChange={(e) => setValue(Number(e.target.value) / 100)}
        onPointerUp={(e) => commit(Number((e.target as HTMLInputElement).value) / 100)}
        onKeyUp={(e) => commit(Number((e.target as HTMLInputElement).value) / 100)}
      />
    </div>
  );
}

/** Positionnement express : glisser, c'est tout. Le programme sert d'affinage. */
function ExpressPositioning({ child }: { child: ChildProfile }) {
  const calendarF = schoolYearFraction(new Date());

  const applyAll = () => {
    for (const d of DOMAINS) {
      const { see, unsee } = expressSelection(d, child.year, calendarF);
      setSeen(child.id, unsee, false);
      setSeen(child.id, see, true);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Où en est la classe ?</h2>
        <button
          className="btn ghost small-btn"
          onClick={applyAll}
          title="Position habituelle à cette période de l'année scolaire"
        >
          Régler selon la période de l'année
        </button>
      </div>
      <p className="muted small">
        Glissez le curseur pour chaque matière — c'est approximatif, et ajustable à tout moment.
        Pour un réglage fin, étape par étape : le programme.
      </p>
      {DOMAINS.map((d) => (
        <ExpressSlider key={d} child={child} domain={d} />
      ))}
    </div>
  );
}

export function ParentHomeView({ store, child, go }: { store: AppStore; child: ChildProfile; go: (r: Route) => void }) {
  const reco = recommendations(child, 4);
  const noPositioning = Object.keys(child.seen).length === 0;

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

      {noPositioning && (
        <div className="card notice">
          <strong>Première étape : le positionnement.</strong> Utilisez le positionnement express
          ci-dessous (10 secondes), puis affinez si besoin dans le programme — missions, contrôles et
          statistiques en dépendent.
        </div>
      )}

      <ExpressPositioning child={child} />

      <div className="card">
        <div className="card-head">
          <h2>Progression de {child.name} par matière</h2>
          <button className="linklike" onClick={() => go({ view: "dashboard" })}>
            détail par objectif →
          </button>
        </div>
        {DOMAINS.map((d) => (
          <DomainRow key={d} child={child} domain={d} go={go} />
        ))}
        <p className="muted small legend-line">
          <span className="seg-dot ok" /> acquis · <span className="seg-dot ko" /> à revoir ·{" "}
          <span className="seg-dot cur" /> en cours (vu, pas encore évalué)
        </p>
      </div>

      {(child.planned.length > 0 || child.revisions.length > 0) && (
        <div className="card">
          <h2>À faire par {child.name}</h2>
          {child.planned.map((p) => (
            <div className="row planned-row" key={p.id}>
              <span className="planned-title">
                📝 {p.title} <span className="muted small">· {p.questionIds.length} questions · une seule tentative</span>
              </span>
              <button className="btn ghost small-btn" onClick={() => deletePlannedTest(child.id, p.id)}>
                Annuler
              </button>
            </div>
          ))}
          {child.revisions.map((p) => (
            <div className="row planned-row" key={p.id}>
              <span className="planned-title">
                📚 {p.title} <span className="muted small">· {p.questionIds.length} questions · rejouable</span>
              </span>
              <button className="btn ghost small-btn" onClick={() => deleteRevision(child.id, p.id)}>
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}

      {entitlements.canSeeRecommendations &&
        (reco.readyToTest.length > 0 || reco.toRework.length > 0 || reco.toPractice.length > 0) && (
          <div className="card">
            <h2>
              Recommandations <span className="tier-badge inline">{TIER_LABEL[tierFor((e) => e.canSeeRecommendations)]}</span>
            </h2>
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
                <h3>À retravailler (raté au dernier contrôle)</h3>
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
                <h3>À réviser (vu en classe, jamais entraîné)</h3>
                <ul>
                  {reco.toPractice.map((i) => (
                    <li key={i.step.id}>
                      {i.step.text.slice(0, 90)} <span className="per-chip">{i.objective.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      {child.tests.length > 0 && (
        <div className="card">
          <h2>Contrôles passés</h2>
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
            Enregistrés en une fois, non modifiables, une seule tentative par contrôle.
          </p>
        </div>
      )}

      <div className="card profile-card">
        <h2>Profil de {child.name}</h2>
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
        <PinSettings pinHash={store.parentPinHash} />
        <div className="row" style={{ marginTop: 10 }}>
          {store.children.length > 1 && (
            <button
              className="btn danger small-btn"
              onClick={() => {
                if (window.confirm(`Supprimer le profil de ${child.name} et toute sa progression ?`))
                  removeChild(child.id);
              }}
            >
              Supprimer ce profil
            </button>
          )}
          <button
            className="btn danger small-btn"
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
