import { useState } from "react";
import type { Route } from "../App";
import { stepInfo, type MissionQuestion } from "../lib/engine";
import { recordAnswer } from "../store";
import type { Question } from "../types";

const normalize = (s: string) =>
  s.toLowerCase().replace(/['\s ]/g, "").replace(/,/g, ".");

const isCorrectInput = (q: Question, value: string) =>
  (q.accepted ?? []).some((a) => normalize(a) === normalize(value));

interface Outcome {
  mq: MissionQuestion;
  correct: boolean;
}

export function MissionView({
  title,
  emoji,
  questions,
  go,
}: {
  title: string;
  emoji: string;
  questions: MissionQuestion[];
  go: (r: Route) => void;
}) {
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [answered, setAnswered] = useState<null | { correct: boolean; picked?: number }>(null);
  const [inputValue, setInputValue] = useState("");
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="card quiz-end">
        <h1>Rien à tester ici pour l'instant</h1>
        <button className="btn primary" onClick={() => go({ view: "home" })}>
          🏠 Accueil
        </button>
      </div>
    );
  }

  const mq = questions[index];
  const q = mq.question;

  const submit = (correct: boolean, picked?: number) => {
    if (answered) return;
    setAnswered({ correct, picked });
    setOutcomes((o) => [...o, { mq, correct }]);
    recordAnswer(mq.stepId, correct);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswered(null);
      setInputValue("");
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const score = outcomes.filter((o) => o.correct).length;
    const ratio = score / questions.length;
    const msg =
      ratio >= 0.8 ? "Bravo ! 🎉" : ratio >= 0.5 ? "Bien joué, continue ! 💪" : "Courage, on y retourne ! 🌱";
    return (
      <div className="card quiz-end">
        <span className="theme-emoji big">{emoji}</span>
        <h1>{msg}</h1>
        <p className="score-big">
          {score} / {questions.length}
        </p>
        <div className="mission-recap">
          {outcomes.map((o, i) => {
            const info = stepInfo(o.mq.stepId);
            return (
              <div key={i} className={`recap-line ${o.correct ? "ok" : "ko"}`}>
                <span>{o.correct ? "✅" : "❌"}</span>
                <span className="recap-step">
                  {info ? info.step.text : o.mq.question.prompt}
                  <span className="per-chip">{info?.objective.code}</span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="row center">
          <button className="btn primary" onClick={() => go({ view: "home" })}>
            🏠 Accueil
          </button>
          <button className="btn ghost" onClick={() => go({ view: "dashboard" })}>
            👪 Voir la progression
          </button>
        </div>
      </div>
    );
  }

  const passage = mq.theme.passage;

  return (
    <div className={`quiz ${mq.theme.domain}`}>
      <button className="btn ghost back" onClick={() => go({ view: "home" })}>
        ← Quitter
      </button>

      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="muted quiz-counter">
        {emoji} {title} · question {index + 1} sur {questions.length}
      </p>

      {passage && (
        <details className="passage-details" open={index === 0}>
          <summary>📖 Relire le texte</summary>
          <p>{passage}</p>
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
            <p className="muted small">
              Étape du PER : {stepInfo(mq.stepId)?.step.text.slice(0, 110)}…{" "}
              <span className="per-chip">{stepInfo(mq.stepId)?.objective.code}</span>
            </p>
            <button className="btn primary" onClick={next} autoFocus>
              {index + 1 < questions.length ? "Question suivante →" : "Voir mon score 🏁"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
