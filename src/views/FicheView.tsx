import type { Route } from "../App";
import { ThemeIcon } from "../components/icons";
import { QUESTION_STEP } from "../data/stepMap";
import type { Theme } from "../types";

export function FicheView({ theme, go }: { theme: Theme; go: (r: Route) => void }) {
  const launchQuiz = () =>
    go({
      view: "mission",
      mode: "practice",
      title: theme.title,
      questions: theme.questions
        .map((question) => ({ question, stepId: QUESTION_STEP[question.id], theme }))
        .filter((mq) => mq.stepId !== undefined),
    });

  return (
    <div className={`fiche ${theme.domain}`}>
      <button className="btn back" onClick={() => go({ view: "home" })}>
        ← Retour
      </button>
      <div className="card">
        <div className="theme-head">
          <span className={`theme-icon ${theme.domain}`}>
            <ThemeIcon themeId={theme.id} size={30} />
          </span>
          <div>
            <h1>{theme.title}</h1>
            <p className="muted">
              Fiche de révision · <span className="per-chip">{theme.perCode}</span>
            </p>
          </div>
        </div>

        {theme.passage && (
          <blockquote className="passage">
            <strong>Le texte à lire :</strong>
            <p>{theme.passage}</p>
          </blockquote>
        )}

        {theme.fiche.map((s) => (
          <section key={s.title} className="fiche-section">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
            {s.examples && (
              <ul className="examples">
                {s.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="fiche-cta">
          <button className="btn primary big" onClick={launchQuiz}>
            Je suis prêt·e, lance le quizz !
          </button>
        </div>
      </div>
    </div>
  );
}
