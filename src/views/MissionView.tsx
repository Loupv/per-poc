import { useEffect, useRef, useState } from "react";
import type { Route } from "../App";
import { Figure } from "../components/figures";
import { correctAnswerText, MatchPairs, MultiChoice, OrderList, SortBuckets } from "../components/formats";
import { IconCheck, IconCross, IconVolume, IconVolumeOff } from "../components/icons";
import { YearMap } from "../components/YearMap";
import { stepInfo, type MissionQuestion } from "../lib/engine";
import { pickFact } from "../lib/funfacts";
import { buzz, playCorrect, playEnd, playWrong, setSoundEnabled, soundEnabled } from "../lib/sound";
import { recordPractice, recordSession, recordTest } from "../store";
import type { ChildProfile, Question, TestAnswer } from "../types";

const normalize = (s: string) =>
  s.toLowerCase().replace(/['\s ]/g, "").replace(/,/g, ".");

const isCorrectInput = (q: Question, value: string) =>
  (q.accepted ?? []).some((a) => normalize(a) === normalize(value));

export type RunMode = "practice" | "test";

const MAX_TRIES = 3;

interface RunItem {
  mq: MissionQuestion;
  retry: boolean;
  tries: number;
}

interface Outcome {
  mq: MissionQuestion;
  correct: boolean;
}

/**
 * Runner commun, plein écran. Entraînement : feedback immédiat, auto-avance sur
 * bonne réponse, et les questions ratées reviennent en fin de session jusqu'à
 * réussite (max 3 passages) — on ne quitte jamais sur un échec.
 * Contrôle : rien n'est révélé avant la fin, résultat immuable, pas de rattrapage.
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
  const [items, setItems] = useState<RunItem[]>(() =>
    questions.map((mq) => ({ mq, retry: false, tries: 1 }))
  );
  const [index, setIndex] = useState(0);
  const [firstOutcomes, setFirstOutcomes] = useState<Outcome[]>([]);
  const [retriesUsed, setRetriesUsed] = useState(0);
  const [answered, setAnswered] = useState<null | { correct: boolean; picked?: number }>(null);
  const [inputValue, setInputValue] = useState("");
  const [finished, setFinished] = useState(false);
  const [fact, setFact] = useState<string | null>(null);
  const [shownFacts] = useState(() => new Set<string>());
  const [sound, setSound] = useState(soundEnabled());

  const isTest = mode === "test";
  const item = items[index];
  const nextRef = useRef<() => void>(() => {});

  const finish = (outcomes: Outcome[]) => {
    if (isTest) {
      const answers: TestAnswer[] = outcomes.map((o) => ({
        questionId: o.mq.question.id,
        stepId: o.mq.stepId,
        correct: o.correct,
      }));
      recordTest(childId, planId, title, answers);
    } else {
      recordSession(childId, title, outcomes.filter((o) => o.correct).length, outcomes.length);
      playEnd();
    }
    setFinished(true);
  };

  const next = () => {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setAnswered(null);
      setInputValue("");
      setFact(null);
    } else {
      finish(firstOutcomes);
    }
  };
  nextRef.current = next;

  // Auto-avance : bonne réponse sans fait (entraînement), toute réponse (contrôle)
  useEffect(() => {
    if (!answered || finished) return;
    const auto = isTest || (answered.correct && !fact);
    if (!auto) return;
    const t = setTimeout(() => nextRef.current(), isTest ? 600 : 950);
    return () => clearTimeout(t);
  }, [answered, fact, isTest, finished]);

  if (items.length === 0) {
    return (
      <div className="quiz-end">
        <h1>Rien à tester ici pour l'instant</h1>
        <button className="btn primary" onClick={() => go({ view: "home" })}>
          Accueil
        </button>
      </div>
    );
  }

  const mq = item.mq;
  const q = mq.question;

  const submit = (correct: boolean, picked?: number) => {
    if (answered) return;
    setAnswered({ correct, picked });
    if (correct) {
      playCorrect();
      buzz(10);
    } else {
      playWrong();
      buzz([0, 40]);
    }
    if (!item.retry) setFirstOutcomes((o) => [...o, { mq, correct }]);
    if (!isTest) {
      recordPractice(childId, mq.stepId, correct, mq.question.id);
      // rattrapage : la question ratée reviendra en fin de session
      if (!correct && item.tries < MAX_TRIES) {
        setItems((arr) => [...arr, { mq, retry: true, tries: item.tries + 1 }]);
        setRetriesUsed((r) => r + 1);
      }
      if (correct && Math.random() < 0.35) {
        const f = pickFact(mq.stepId, shownFacts);
        if (f) {
          shownFacts.add(f);
          setFact(f);
        } else setFact(null);
      } else setFact(null);
    }
  };

  if (finished) {
    const score = firstOutcomes.filter((o) => o.correct).length;
    const total = firstOutcomes.length;
    const ratio = total ? score / total : 0;
    const msg = isTest
      ? "Contrôle terminé et enregistré !"
      : ratio >= 0.8
        ? "Bravo !"
        : ratio >= 0.5
          ? "Bien joué, continue !"
          : "Chaque erreur retravaillée est une victoire !";
    return (
      <div className="quiz-end">
        <h1>{msg}</h1>
        <p className="score-big">
          {score} / {total}
        </p>
        {isTest ? (
          <p className="muted">
            Le résultat est enregistré pour tes parents — un contrôle ne se refait pas, mais tu peux
            t'entraîner autant que tu veux !
          </p>
        ) : (
          retriesUsed > 0 && (
            <p className="muted">
              Tu as retravaillé {retriesUsed} question{retriesUsed > 1 ? "s" : ""} jusqu'au bout —
              c'est comme ça qu'on apprend.
            </p>
          )
        )}
        <div className="mission-recap">
          {firstOutcomes.map((o, i) => {
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
        {!isTest && <YearMap child={child} workedStepIds={new Set(firstOutcomes.map((o) => o.mq.stepId))} />}
        <div className="row center">
          <button className="btn primary big" onClick={() => go({ view: "home" })}>
            Accueil
          </button>
        </div>
      </div>
    );
  }

  const passage = mq.theme.passage;

  return (
    <div className={`quiz focus ${mq.theme.domain}`}>
      <div className="quiz-top">
        <div className="quiz-progress">
          <div
            className="quiz-progress-bar"
            style={{ width: `${(index / items.length) * 100}%` }}
          />
        </div>
        <button
          className="icon-btn"
          title={sound ? "Couper le son" : "Activer le son"}
          onClick={() => {
            setSoundEnabled(!sound);
            setSound(!sound);
          }}
        >
          {sound ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
        </button>
        {!isTest && (
          <button className="icon-btn" title="Quitter" onClick={() => go({ view: "home" })}>
            <IconCross size={18} />
          </button>
        )}
      </div>
      <p className="muted quiz-counter">
        {item.retry ? "Rattrapage — on la retente !" : title}
        {" · "}
        {index + 1} / {items.length}
        {isTest && " · corrigé à la fin"}
      </p>

      {passage && (
        <details className="passage-details" open={index === 0}>
          <summary>Relire le texte</summary>
          <p>{passage}</p>
        </details>
      )}

      <div className="card question-card slide-in" key={index}>
        <h2>{q.prompt}</h2>
        {q.figure && <Figure id={q.figure} />}

        {q.type === "mcq" && (
          <div className={`choices ${q.choiceFigures ? "fig-grid" : ""}`}>
            {q.choices!.map((c, i) => {
              let cls = q.choiceFigures ? "choice fig" : "choice";
              if (answered) {
                if (isTest) cls += i === answered.picked ? " picked" : " dim";
                else if (i === q.answerIndex) cls += " correct pop";
                else if (i === answered.picked) cls += " wrong shake";
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

        {q.type === "multi" && (
          <MultiChoice q={q} disabled={!!answered} onSubmit={(c) => submit(c)} key={`m${index}`} />
        )}
        {q.type === "order" && (
          <OrderList q={q} disabled={!!answered} onSubmit={(c) => submit(c)} key={`o${index}`} />
        )}
        {q.type === "match" && (
          <MatchPairs q={q} disabled={!!answered} onSubmit={(c) => submit(c)} key={`p${index}`} />
        )}
        {q.type === "sort" && (
          <SortBuckets q={q} disabled={!!answered} onSubmit={(c) => submit(c)} key={`s${index}`} />
        )}

        {answered && (
          <div className={`feedback ${isTest ? "neutral" : answered.correct ? "ok pop" : "ko"}`}>
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
                  <p className="correct-answer">Bonne réponse : {correctAnswerText(q)}</p>
                )}
                {!answered.correct && <p>{q.explanation}</p>}
                {fact && <p className="funfact">Le savais-tu ? {fact}</p>}
                {answered.correct && !fact && (
                  <p className="muted small">
                    Étape du PER : {stepInfo(mq.stepId)?.step.text.slice(0, 90)}…{" "}
                    <span className="per-chip">{stepInfo(mq.stepId)?.objective.code}</span>
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {answered && !(isTest || (answered.correct && !fact)) && (
        <div className="quiz-cta">
          <button className="btn primary big cta-btn" onClick={next} autoFocus>
            {index + 1 < items.length ? "Continuer" : "Voir mon score"}
          </button>
        </div>
      )}
    </div>
  );
}
