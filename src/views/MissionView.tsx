import { useState } from "react";
import type { Route } from "../App";
import { Figure } from "../components/figures";
import { correctAnswerText, MatchPairs, MultiChoice, OrderList, SortBuckets } from "../components/formats";
import { IconCheck, IconCross } from "../components/icons";
import { YearMap } from "../components/YearMap";
import { stepInfo, type MissionQuestion } from "../lib/engine";
import { pickFact } from "../lib/funfacts";
import { recordPractice, recordSession, recordTest } from "../store";
import type { ChildProfile, Question, TestAnswer } from "../types";

const normalize = (s: string) =>
  s.toLowerCase().replace(/['\s ]/g, "").replace(/,/g, ".");

const isCorrectInput = (q: Question, value: string) =>
  (q.accepted ?? []).some((a) => normalize(a) === normalize(value));

export type RunMode = "practice" | "test";

interface Outcome {
  mq: MissionQuestion;
  correct: boolean;
}

/**
 * Runner commun. En entraînement : feedback immédiat, chaque réponse nourrit
 * l'historique d'entraînement. En contrôle : aucune correction avant la fin,
 * résultat enregistré en une fois (immuable), le contrôle planifié est consommé.
 */
export function MissionView({
  child,
  mode,
  planId = null,
  title,
  questions,
  go,
}: {
  child: ChildProfile;
  mode: RunMode;
  planId?: string | null;
  title: string;
  questions: MissionQuestion[];
  go: (r: Route) => void;
}) {
  const childId = child.id;
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [answered, setAnswered] = useState<null | { correct: boolean; picked?: number }>(null);
  const [inputValue, setInputValue] = useState("");
  const [finished, setFinished] = useState(false);
  const [fact, setFact] = useState<string | null>(null);
  const [shownFacts] = useState(() => new Set<string>());

  const isTest = mode === "test";

  if (questions.length === 0) {
    return (
      <div className="quiz-end">
        <h1>Rien à tester ici pour l'instant</h1>
        <button className="btn primary" onClick={() => go({ view: "home" })}>
          Accueil
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
    if (!isTest) {
      recordPractice(childId, mq.stepId, correct, mq.question.id);
      // « Le savais-tu ? » : de temps en temps, après une bonne réponse
      if (correct && Math.random() < 0.35) {
        const f = pickFact(mq.theme.domain, shownFacts);
        if (f) {
          shownFacts.add(f);
          setFact(f);
        } else setFact(null);
      } else setFact(null);
    }
  };

  const next = (allOutcomes: Outcome[]) => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswered(null);
      setInputValue("");
    } else {
      const score = allOutcomes.filter((o) => o.correct).length;
      if (isTest) {
        const answers: TestAnswer[] = allOutcomes.map((o) => ({
          questionId: o.mq.question.id,
          stepId: o.mq.stepId,
          correct: o.correct,
        }));
        recordTest(childId, planId, title, answers);
      } else {
        recordSession(childId, title, score, allOutcomes.length);
      }
      setFinished(true);
    }
  };

  if (finished) {
    const score = outcomes.filter((o) => o.correct).length;
    const ratio = score / questions.length;
    const msg = isTest
      ? "Contrôle terminé et enregistré !"
      : ratio >= 0.8
        ? "Bravo !"
        : ratio >= 0.5
          ? "Bien joué, continue !"
          : "Courage, on y retourne !";
    return (
      <div className="quiz-end">
        <h1>{msg}</h1>
        <p className="score-big">
          {score} / {questions.length}
        </p>
        {isTest && (
          <p className="muted">
            Le résultat est enregistré pour tes parents — un contrôle ne se refait pas, mais tu peux
            t'entraîner autant que tu veux !
          </p>
        )}
        <div className="mission-recap">
          {outcomes.map((o, i) => {
            const info = stepInfo(o.mq.stepId);
            return (
              <div key={i} className={`recap-line ${o.correct ? "ok" : "ko"}`}>
                <span className={`recap-mark ${o.correct ? "ok" : "ko"}`}>
                  {o.correct ? <IconCheck size={14} /> : <IconCross size={14} />}
                </span>
                <span className="recap-step">
                  {o.mq.question.prompt}
                  {!o.correct && <em className="recap-expl"> — {o.mq.question.explanation}</em>}
                  <span className="per-chip">{info?.objective.code}</span>
                </span>
              </div>
            );
          })}
        </div>
        {!isTest && <YearMap child={child} workedStepIds={new Set(outcomes.map((o) => o.mq.stepId))} />}
        <div className="row center">
          <button className="btn primary" onClick={() => go({ view: "home" })}>
            Accueil
          </button>
        </div>
      </div>
    );
  }

  const passage = mq.theme.passage;

  return (
    <div className={`quiz ${mq.theme.domain}`}>
      {!isTest && (
        <button className="btn back" onClick={() => go({ view: "home" })}>
          ← Quitter
        </button>
      )}

      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="muted quiz-counter">
        {title} · question {index + 1} sur {questions.length}
        {isTest && " · mode contrôle : les réponses sont corrigées à la fin"}
      </p>

      {passage && (
        <details className="passage-details" open={index === 0}>
          <summary>Relire le texte</summary>
          <p>{passage}</p>
        </details>
      )}

      <div className="card question-card">
        <h2>{q.prompt}</h2>
        {q.figure && <Figure id={q.figure} />}

        {q.type === "mcq" && (
          <div className={`choices ${q.choiceFigures ? "fig-grid" : ""}`}>
            {q.choices!.map((c, i) => {
              let cls = q.choiceFigures ? "choice fig" : "choice";
              if (answered) {
                if (isTest) cls += i === answered.picked ? " picked" : " dim";
                else if (i === q.answerIndex) cls += " correct";
                else if (i === answered.picked) cls += " wrong";
                else cls += " dim";
              }
              return (
                <button key={c} className={cls} disabled={!!answered} onClick={() => submit(i === q.answerIndex, i)}>
                  {q.choiceFigures ? (
                    <>
                      <span className="fig-letter">{c}</span>
                      <Figure id={q.choiceFigures[i]} />
                    </>
                  ) : (
                    c
                  )}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "multi" && (
          <MultiChoice key={q.id} q={q} disabled={!!answered} onSubmit={(c) => submit(c)} />
        )}
        {q.type === "order" && (
          <OrderList key={q.id} q={q} disabled={!!answered} onSubmit={(c) => submit(c)} />
        )}
        {q.type === "match" && (
          <MatchPairs key={q.id} q={q} disabled={!!answered} onSubmit={(c) => submit(c)} />
        )}
        {q.type === "sort" && (
          <SortBuckets key={q.id} q={q} disabled={!!answered} onSubmit={(c) => submit(c)} />
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
          <div className={`feedback ${isTest ? "neutral" : answered.correct ? "ok" : "ko"}`}>
            {isTest ? (
              <strong className="feedback-title">
                <IconCheck size={15} /> Réponse enregistrée
              </strong>
            ) : (
              <>
                <strong className={`feedback-title ${answered.correct ? "ok" : "ko"}`}>
                  {answered.correct ? <IconCheck size={15} /> : <IconCross size={15} />}
                  {answered.correct ? "Juste !" : "Pas tout à fait…"}
                </strong>
                {!answered.correct && correctAnswerText(q) && (
                  <p className="correct-answer">
                    Bonne réponse : {correctAnswerText(q)}
                  </p>
                )}
                <p>{q.explanation}</p>
                {answered.correct && fact && (
                  <p className="funfact">Le savais-tu ? {fact}</p>
                )}
                <p className="muted small">
                  Étape du PER : {stepInfo(mq.stepId)?.step.text.slice(0, 110)}…{" "}
                  <span className="per-chip">{stepInfo(mq.stepId)?.objective.code}</span>
                </p>
              </>
            )}
            <button className="btn primary" onClick={() => next(outcomes)} autoFocus>
              {index + 1 < questions.length
                ? "Question suivante →"
                : isTest
                  ? "Terminer le contrôle"
                  : "Voir mon score"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
