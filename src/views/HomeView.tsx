import type { Route } from "../App";
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

function ThemeCard({ theme, child, go }: { theme: Theme; child: ChildProfile; go: (r: Route) => void }) {
  const stepIds = [...new Set(theme.questions.map((q) => QUESTION_STEP[q.id]).filter(Boolean))];
  const trained = stepIds.filter((id) => practiceLevel(child, id) === "mastered").length;
  return (
    <div className={`card theme-card ${theme.domain}`}>
      <div className="theme-head">
        <span className="theme-emoji">{theme.emoji}</span>
        <div>
          <h3>{theme.title}</h3>
          <p className="muted">{theme.subtitle}</p>
        </div>
      </div>
      <div className="theme-meta">
        <span className="per-chip">{theme.perCode}</span>
        <span className="muted small">
          {trained}/{stepIds.length} étapes bien entraînées
        </span>
      </div>
      <div className="theme-actions">
        <button className="btn ghost" onClick={() => go({ view: "fiche", id: theme.id })}>
          📚 Fiche
        </button>
        <button
          className="btn primary"
          onClick={() =>
            go({
              view: "mission",
              mode: "practice",
              title: theme.title,
              emoji: theme.emoji,
              questions: themeQuestions(theme),
            })
          }
        >
          ▶ Quizz
        </button>
      </div>
    </div>
  );
}

/** Accueil enfant : contrôles à faire, mission d'entraînement, retest, thèmes. */
export function HomeView({ store, child, go }: { store: AppStore; child: ChildProfile; go: (r: Route) => void }) {
  const seenCount = Object.keys(child.seen).length;
  const mission = buildMission(child, { kind: "current" });
  const pastYears = YEARS.filter((y) => y < child.year);

  return (
    <>
      <div className="row hello-row">
        <h1 className="hello">Salut {child.name} ! 🚀</h1>
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

      {child.revisions.length > 0 && (
        <div className="card">
          <h2>📚 Révisions préparées par tes parents</h2>
          {child.revisions.map((p) => {
            const qs = p.questionIds.map(questionById).filter(Boolean) as MissionQuestion[];
            return (
              <div className="row planned-row" key={p.id}>
                <span className="planned-title">
                  {p.title} <span className="muted small">· {qs.length} questions · rejouable</span>
                </span>
                <button
                  className="btn primary small-btn"
                  onClick={() =>
                    go({ view: "mission", mode: "practice", title: p.title, emoji: "📚", questions: qs })
                  }
                >
                  ▶ Réviser
                </button>
              </div>
            );
          })}
        </div>
      )}

      {child.planned.length > 0 && (
        <div className="card test-card">
          <h2>📝 Contrôles à faire</h2>
          <p className="muted">
            Préparés par tes parents. Un contrôle se fait en une fois : les réponses sont corrigées à
            la fin. Entraîne-toi avant si tu veux !
          </p>
          {child.planned.map((p) => {
            const qs = p.questionIds.map(questionById).filter(Boolean) as MissionQuestion[];
            return (
              <div className="row planned-row" key={p.id}>
                <span className="planned-title">
                  {p.title} <span className="muted small">· {qs.length} questions</span>
                </span>
                <button
                  className="btn primary"
                  onClick={() =>
                    go({ view: "mission", mode: "test", planId: p.id, title: p.title, emoji: "📝", questions: qs })
                  }
                >
                  ▶ Commencer
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="card mission-card">
        <div className="mission-head">
          <span className="theme-emoji big">🎯</span>
          <div>
            <h2>Ma mission d'entraînement — {child.year}P</h2>
            {seenCount === 0 ? (
              <p className="muted">
                Demande à un parent d'indiquer dans l'<strong>espace parents</strong> ce que tu as
                déjà vu en classe : ta mission sera prête juste après !
              </p>
            ) : mission.length === 0 ? (
              <p className="muted">Rien à réviser pour l'instant — reviens bientôt !</p>
            ) : (
              <p className="muted">
                {mission.length} questions pour t'entraîner, avec les explications à chaque réponse.
                Ça ne compte pas comme un contrôle !
              </p>
            )}
          </div>
        </div>
        <div className="row">
          {mission.length > 0 && (
            <button
              className="btn primary big"
              onClick={() =>
                go({
                  view: "mission",
                  mode: "practice",
                  title: `Entraînement — ${child.year}P`,
                  emoji: "🎯",
                  questions: mission,
                })
              }
            >
              ▶ M'entraîner
            </button>
          )}
          <button className="btn ghost" onClick={() => go({ view: "programme" })}>
            🗺️ Voir le programme
          </button>
        </div>
      </div>

      {pastYears.length > 0 && entitlements.canRetestPastYears && (
        <div className="card past-card">
          <h2>🔄 Se retester sur les années précédentes</h2>
          <p className="muted">
            Là, pas besoin de positionnement : tout le programme de l'année est révisé.
          </p>
          <div className="row">
            {pastYears.map((y) => {
              const m = buildMission(child, { kind: "pastYear", year: y });
              return (
                <button
                  key={y}
                  className="btn ghost"
                  disabled={m.length === 0}
                  onClick={() =>
                    go({
                      view: "mission",
                      mode: "practice",
                      title: `Retest ${y}P — tout le programme`,
                      emoji: "🔄",
                      questions: m,
                    })
                  }
                >
                  Tester la {y}P {m.length === 0 ? "(bientôt)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section className="domain-section">
        <div className="domain-title">
          <h2>💪 M'entraîner par thème</h2>
        </div>
        <div className="grid">
          {THEMES.map((t) => (
            <ThemeCard key={t.id} theme={t} child={child} go={go} />
          ))}
        </div>
      </section>
    </>
  );
}
