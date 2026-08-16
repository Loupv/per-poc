import type { Route } from "../App";
import { THEMES } from "../data/content";
import { QUESTION_STEP } from "../data/stepMap";
import { buildMission, stepMastery, type MissionQuestion } from "../lib/engine";
import type { AppStore, Theme } from "../types";

const YEARS = [5, 6, 7, 8];

function themeQuestions(theme: Theme): MissionQuestion[] {
  return theme.questions
    .map((question) => ({ question, stepId: QUESTION_STEP[question.id], theme }))
    .filter((mq) => mq.stepId !== undefined);
}

function ThemeCard({ theme, store, go }: { theme: Theme; store: AppStore; go: (r: Route) => void }) {
  const stepIds = [...new Set(theme.questions.map((q) => QUESTION_STEP[q.id]).filter(Boolean))];
  const mastered = stepIds.filter((id) => stepMastery(store, id) === "mastered").length;
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
          {mastered}/{stepIds.length} étapes maîtrisées
        </span>
      </div>
      <div className="theme-actions">
        <button className="btn ghost" onClick={() => go({ view: "fiche", id: theme.id })}>
          📚 Fiche
        </button>
        <button
          className="btn primary"
          onClick={() =>
            go({ view: "mission", title: theme.title, emoji: theme.emoji, questions: themeQuestions(theme) })
          }
        >
          ▶ Quizz
        </button>
      </div>
    </div>
  );
}

/** Accueil enfant : mission du jour, retest des années précédentes, entraînement, fiches. */
export function HomeView({ store, go }: { store: AppStore; go: (r: Route) => void }) {
  const child = store.child!;
  const seenCount = Object.keys(store.seen).length;
  const mission = buildMission(store, { kind: "current" });
  const pastYears = YEARS.filter((y) => y < child.year);

  return (
    <>
      <h1 className="hello">Salut {child.name} ! 🚀</h1>

      <div className="card mission-card">
        <div className="mission-head">
          <span className="theme-emoji big">🎯</span>
          <div>
            <h2>Ma mission du jour — {child.year}P</h2>
            {seenCount === 0 ? (
              <p className="muted">
                Demande à un parent d'indiquer dans l'<strong>espace parents</strong> ce que tu as
                déjà vu en classe : ta mission sera prête juste après !
              </p>
            ) : mission.length === 0 ? (
              <p className="muted">
                Rien à tester pour l'instant sur les étapes vues en classe — reviens bientôt !
              </p>
            ) : (
              <p className="muted">
                {mission.length} questions choisies pour toi : d'abord ce qui n'a jamais été testé,
                puis ce qui est encore fragile.
              </p>
            )}
          </div>
        </div>
        <div className="row">
          {mission.length > 0 && (
            <button
              className="btn primary big"
              onClick={() =>
                go({ view: "mission", title: `Mission du jour — ${child.year}P`, emoji: "🎯", questions: mission })
              }
            >
              ▶ Lancer ma mission
            </button>
          )}
          <button className="btn ghost" onClick={() => go({ view: "programme" })}>
            🗺️ Voir le programme
          </button>
        </div>
      </div>

      {pastYears.length > 0 && (
        <div className="card past-card">
          <h2>🔄 Se retester sur les années précédentes</h2>
          <p className="muted">
            Là, pas besoin de positionnement : tout le programme de l'année est testé.
          </p>
          <div className="row">
            {pastYears.map((y) => {
              const m = buildMission(store, { kind: "pastYear", year: y });
              return (
                <button
                  key={y}
                  className="btn ghost"
                  disabled={m.length === 0}
                  onClick={() =>
                    go({ view: "mission", title: `Retest ${y}P — tout le programme`, emoji: "🔄", questions: m })
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
            <ThemeCard key={t.id} theme={t} store={store} go={go} />
          ))}
        </div>
      </section>
    </>
  );
}
