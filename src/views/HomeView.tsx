import type { Route } from "../App";
import { IconBookOpen, IconClipboardCheck, IconRotate, IconTarget, IconZap, ThemeIcon } from "../components/icons";
import { Marmotte, MarmotteSays } from "../components/Marmotte";
import { Path } from "../components/Path";
import { THEMES } from "../data/content";
import { buildMission, questionById, type MissionQuestion } from "../lib/engine";
import { entitlements } from "../lib/plan";
import { setActiveChild } from "../store";
import type { AppStore, ChildProfile } from "../types";

const YEARS = [5, 6, 7, 8];

/** Accueil enfant : une grille de grandes cartes, chaque carte = une action. */
export function HomeView({ store, child, go }: { store: AppStore; child: ChildProfile; go: (r: Route) => void }) {
  const seenCount = Object.keys(child.seen).length;
  const mission = buildMission(child, { kind: "current" });
  const pastYears = entitlements.canRetestPastYears ? YEARS.filter((y) => y < child.year) : [];

  return (
    <>
      <div className="row hello-row">
        <h1 className="hello">Salut {child.name} !</h1>
        {store.children.length > 1 && (
          <div className="row child-switch">
            {store.children.map((c) => (
              <button
                key={c.id}
                className={`year-chip ${c.id === child.id ? "selected" : ""}`}
                onClick={() => setActiveChild(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {seenCount === 0 && (
        <MarmotteSays pose="salue">
          Salut ! Je t'attends sur le sentier. Avant de partir, un parent doit préparer l'itinéraire
          dans l'espace parents — il indique ce que vous avez déjà vu en classe.
        </MarmotteSays>
      )}

      <div className="tilegrid hero">
        {child.planned.map((p) => {
          const qs = p.questionIds.map(questionById).filter(Boolean) as MissionQuestion[];
          return (
            <button
              key={p.id}
              className="tile-btn test"
              onClick={() =>
                go({ view: "mission", mode: "test", planId: p.id, title: p.title, questions: qs })
              }
            >
              <span className="tile-icon">
                <IconClipboardCheck size={26} />
              </span>
              <strong>Contrôle</strong>
              <span className="tile-sub">{qs.length} questions · une seule fois, corrigé à la fin</span>
            </button>
          );
        })}

        {mission.length > 0 ? (
          <button
            className="tile-btn mission"
            onClick={() =>
              go({
                view: "mission",
                mode: "practice",
                title: `Entraînement — ${child.year}P`,
                questions: mission,
              })
            }
          >
            <span className="tile-icon">
              <IconTarget size={26} />
            </span>
            <strong>Ma sortie du jour</strong>
            <span className="tile-sub">{mission.length} questions choisies pour toi</span>
          </button>
        ) : (
          <div className="tile-btn off">
            <span className="tile-icon sleeping">
              <Marmotte pose="dort" size={44} />
            </span>
            <strong>Ma sortie du jour</strong>
            <span className="tile-sub">
              {seenCount === 0
                ? "La marmotte dort : un parent doit d'abord préparer l'itinéraire."
                : "Rien à réviser pour l'instant — la marmotte fait la sieste."}
            </span>
          </div>
        )}

        {child.revisions.map((p) => {
          const qs = p.questionIds.map(questionById).filter(Boolean) as MissionQuestion[];
          return (
            <button
              key={p.id}
              className="tile-btn revision"
              onClick={() => go({ view: "mission", mode: "practice", title: p.title, questions: qs })}
            >
              <span className="tile-icon">
                <IconBookOpen size={26} />
              </span>
              <strong>Révision préparée</strong>
              <span className="tile-sub">{qs.length} questions · rejouable</span>
            </button>
          );
        })}

        <button className="tile-btn eclair-tile" onClick={() => go({ view: "eclair" })}>
          <span className="tile-icon">
            <IconZap size={26} />
          </span>
          <strong>Mode éclair</strong>
          <span className="tile-sub">60 secondes de calcul rapide — à toi de jouer</span>
        </button>

        {pastYears.map((y) => {
          const m = buildMission(child, { kind: "pastYear", year: y });
          if (m.length === 0) return null;
          return (
            <button
              key={y}
              className="tile-btn past"
              onClick={() =>
                go({ view: "mission", mode: "practice", title: `Retest ${y}P`, questions: m })
              }
            >
              <span className="tile-icon">
                <IconRotate size={26} />
              </span>
              <strong>Retester la {y}P</strong>
              <span className="tile-sub">tout le programme de {y}P</span>
            </button>
          );
        })}
      </div>

      <h2 className="section-title">Mon sentier de l'année</h2>
      <p className="muted small">
        Le programme balisé, étape par étape — tape une balise pour partir en sortie.
      </p>
      <Path child={child} go={go} />

      <h2 className="section-title">Mes fiches de révision</h2>
      <div className="fiche-links">
        {THEMES.map((t) => (
          <button key={t.id} className={`btn link fiche-link ${t.domain}`} onClick={() => go({ view: "fiche", id: t.id })}>
            <ThemeIcon themeId={t.id} size={15} /> {t.title}
          </button>
        ))}
      </div>
    </>
  );
}
