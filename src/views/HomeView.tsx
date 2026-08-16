import type { Route } from "../App";
import { IconBookOpen, IconClipboardCheck, IconRotate, IconTarget, IconZap, ThemeIcon } from "../components/icons";
import { THEMES } from "../data/content";
import { QUESTION_STEP } from "../data/stepMap";
import { buildMission, practiceLevel, questionById, type MissionQuestion } from "../lib/engine";
import { entitlements } from "../lib/plan";
import { setActiveChild } from "../store";
import type { AppStore, ChildProfile, Theme } from "../types";

const YEARS = [5, 6, 7, 8];

function themeQuestions(theme: Theme): MissionQuestion[] {
  return theme.questions
    .map((question) => ({ question, stepId: QUESTION_STEP[question.id], theme }))
    .filter((mq) => mq.stepId !== undefined);
}

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
            <strong>Ma mission du jour</strong>
            <span className="tile-sub">{mission.length} questions choisies pour toi</span>
          </button>
        ) : (
          <div className="tile-btn off">
            <span className="tile-icon">
              <IconTarget size={26} />
            </span>
            <strong>Ma mission du jour</strong>
            <span className="tile-sub">
              {seenCount === 0
                ? "Demande à un parent de régler l'espace parents !"
                : "Rien à réviser pour l'instant"}
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

      <h2 className="section-title">Je m'entraîne par thème</h2>
      <div className="tilegrid themes">
        {THEMES.map((t) => {
          const stepIds = [...new Set(t.questions.map((q) => QUESTION_STEP[q.id]).filter(Boolean))];
          const trained = stepIds.filter((id) => practiceLevel(child, id) === "mastered").length;
          return (
            <button
              key={t.id}
              className={`tile-btn theme ${t.domain}`}
              onClick={() =>
                go({ view: "mission", mode: "practice", title: t.title, questions: themeQuestions(t) })
              }
            >
              <span className="tile-icon">
                <ThemeIcon themeId={t.id} size={24} />
              </span>
              <strong>{t.title}</strong>
              <span className="tile-sub">
                {trained}/{stepIds.length} étapes au top
              </span>
              <span
                className="tile-fiche"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  go({ view: "fiche", id: t.id });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    go({ view: "fiche", id: t.id });
                  }
                }}
              >
                voir la fiche
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
