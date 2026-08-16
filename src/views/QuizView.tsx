import { useState } from "react";
import type { Route } from "../App";
import { recordResult } from "../store";
import type { Question, Theme } from "../types";

const normalize = (s: string) =>
  s.toLowerCase().replace(/['\s ]/g, "").replace(/,/g, ".");

const isCorrectInput = (q: Question, value: string) =>
  (q.accepted ?? []).some((a) => normalize(a) === normalize(value));

export function QuizView({ theme, go }: { theme: Theme; go: (r: Route) => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<null | { correct: boolean; picked?: number }>(null);
  const [inputValue, setInputValue] = useState("");
  const [finished, setFinished] = useState(false);

  const questions = theme.questions;
  const q = questions[index];

  const submit = (correct: boolean, picked?: number) => {
    if (answered) return;
    setAnswered({ correct, picked });
    if (correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswered(null);
      setInputValue("");
    } else {
      const finalScore = score;
      recordResult(theme.id, finalScore, questions.length);
      setFinished(true);
    }
  };

  if (finished) {
    const ratio = score / questions.length;
    const msg =
      ratio >= 0.8
        ? "Bravo, c'est maîtrisé ! 🎉"
        : ratio >= 0.5
          ? "Bien joué, encore un petit effort ! 💪"
          : "Courage, relis la fiche et réessaie ! 🌱";
    return (
      <div className={`card quiz-end ${theme.domain}`}>
        <span className="theme-emoji big">{theme.emoji}</span>
        <h1>{msg}</h1>
        <p className="score-big">
          {score} / {questions.length}
        </p>
        <div className="row center">
          <button className="btn ghost" onClick={() => go({ view: "fiche", id: theme.id })}>
            📚 Revoir la fiche
          </button>
          <button className="btn primary" onClick={() => go({ view: "quiz", id: theme.id })}>
            ↻ Rejouer
          </button>
          <button className="btn ghost" onClick={() => go({ view: "home" })}>
            🏠 Accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`quiz ${theme.domain}`}>
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Quitter
      </button>

      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="muted quiz-counter">
        Question {index + 1} sur {questions.length} · {theme.title}
      </p>

      {theme.passage && (
        <details className="passage-details" open={index === 0}>
          <summary>📖 Relire le texte</summary>
          <p>{theme.passage}</p>
        </details>
      )}

      <div className="card question-card">
        <h2>{q.prompt}</h2>

        {q.type === "mcq" && (
          <div className="choices">
            {q.choices!.map((c, i) => {
              let cls = "choice";
              if (answered) {
                if (i === q.answerIndex) cls += " correct";
                else if (i === answered.picked) cls += " wrong";
                else cls += " dim";
              }
              return (
                <button key={c} className={cls} disabled={!!answered} onClick={() => submit(i === q.answerIndex, i)}>
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "input" && (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) submit(isCorrectInput(q, inputValue));
            }}
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ta réponse…"
              disabled={!!answered}
              autoFocus
              inputMode={/[0-9]/.test((q.accepted ?? [""])[0]) ? "numeric" : "text"}
            />
            <button className="btn primary" type="submit" disabled={!!answered || !inputValue.trim()}>
              Valider
            </button>
          </form>
        )}

        {answered && (
          <div className={`feedback ${answered.correct ? "ok" : "ko"}`}>
            <strong>{answered.correct ? "✅ Juste !" : "❌ Pas tout à fait…"}</strong>
            <p>{q.explanation}</p>
            <button className="btn primary" onClick={next} autoFocus>
              {index + 1 < questions.length ? "Question suivante →" : "Voir mon score 🏁"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
