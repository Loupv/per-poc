import { useEffect, useRef, useState } from "react";
import type { Route } from "../App";
import { Figure } from "../components/figures";
import { correctAnswerText, MatchPairs, MultiChoice, OrderList, SortBuckets } from "../components/formats";
import { IconCheck, IconCross, IconHeadphones, IconVolume, IconVolumeOff } from "../components/icons";
import { MarmotteSays } from "../components/Marmotte";
import { YearMap } from "../components/YearMap";
import { stepInfo, type MissionQuestion } from "../lib/engine";
import { pickFact } from "../lib/funfacts";
import { buzz, canSpeak, playCorrect, playEnd, playWhistle, playWrong, setSoundEnabled, soundEnabled, speak } from "../lib/sound";
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
  const [phase, setPhase] = useState<"intro" | "run" | "milestone">("intro");
  const milestoneShown = useRef(false);

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

  const advance = () => {
    setIndex((i) => i + 1);
    setAnswered(null);
    setInputValue("");
    setFact(null);
  };

  const next = () => {
    if (index + 1 < items.length) {
      // jalon de mi-parcours (entraînement, sessions assez longues)
      if (
        !isTest &&
        !milestoneShown.current &&
        items.length >= 6 &&
        index + 1 === Math.ceil(questions.length / 2)
      ) {
        milestoneShown.current = true;
        setPhase("milestone");
        setTimeout(() => {
          setPhase("run");
          advance();
        }, 1200);
        return;
      }
      advance();
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
          setTimeout(() => playWhistle(), 380);
        } else setFact(null);
      } else setFact(null);
    }
  };

  if (finished) {
    const score = firstOutcomes.filter((o) => o.correct).length;
    const total = firstOutcomes.length;
    const ratio = total ? score / total : 0;
    const msg = isTest
      ? "Contrôle terminé et enregistré"
      : ratio >= 0.8
        ? "Sommet atteint !"
        : ratio >= 0.5
          ? "Belle étape !"
          : "Étape terminée — le sentier était raide";
    return (
      <div className="quiz-end">
        <h1>{msg}</h1>
        <p className="score-big">
          {score} / {total}
        </p>
        {isTest ? (
          <p className="muted">
            Le résultat est enregistré pour tes parents — un contrôle ne se refait pas, mais tu peux
            repartir en sortie autant que tu veux !
          </p>
        ) : (
          <MarmotteSays pose={ratio >= 0.8 ? "sommet" : "salue"} size={70}>
            {retriesUsed > 0
              ? `Tu as repassé ${retriesUsed} fois par les passages difficiles — c'est exactement comme ça qu'on progresse en montagne.`
              : ratio >= 0.8
                ? "Beau parcours ! Regarde tout ce qui s'est allumé sur ta carte."
                : "On avance à son rythme. Le sentier sera plus facile la prochaine fois."}
          </MarmotteSays>
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

  // Écran d'intro de session
  if (phase === "intro") {
    return (
      <div className="session-screen slide-in">
        <p className="muted">{isTest ? "Contrôle" : "Sortie sur le sentier"}</p>
        <h1>{title}</h1>
        <MarmotteSays pose="salue">
          {isTest
            ? `${items.length} questions, une seule tentative. Les réponses sont corrigées à l'arrivée.`
            : `${items.length} questions. Si tu te trompes, on repasse par là avant l'arrivée — c'est le but de la balade.`}
        </MarmotteSays>
        <button className="btn primary big cta-btn" onClick={() => setPhase("run")} autoFocus>
          C'est parti !
        </button>
        {!isTest && (
          <button className="btn link" onClick={() => go({ view: "home" })}>
            Plus tard
          </button>
        )}
      </div>
    );
  }

  // Jalon de mi-parcours
  if (phase === "milestone") {
    const left = items.length - (index + 1);
    return (
      <div className="session-screen pop">
        <h1>Col atteint !</h1>
        <MarmotteSays pose="sommet" size={70}>
          Plus que {left} question{left > 1 ? "s" : ""} avant l'arrivée. Ça descend !
        </MarmotteSays>
      </div>
    );
  }

  const passage = mq.theme.passage;
  const numericInput = q.type === "input" && /^[\d'\s]+$/.test((q.accepted ?? [""])[0]);

  const numpadPress = (k: string) => {
    if (answered) return;
    if (k === "⌫") setInputValue((v) => v.slice(0, -1));
    else if (k === "OK") {
      if (inputValue.trim()) submit(isCorrectInput(q, inputValue));
    } else setInputValue((v) => (v + k).slice(0, 6));
  };

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
        <div className="q-head">
          <h2>{q.prompt}</h2>
          {canSpeak() && (
            <button
              className="icon-btn"
              title="Écouter la consigne"
              onClick={() => speak(q.prompt)}
            >
              <IconHeadphones size={18} />
            </button>
          )}
        </div>
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

        {q.type === "input" && !numericInput && (
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
            />
            <button className="btn primary" type="submit" disabled={!!answered || !inputValue.trim()}>
              Valider
            </button>
          </form>
        )}

        {q.type === "input" && numericInput && (
          <>
            <div className={`numpad-display ${answered ? (answered.correct ? "ok" : "ko") : ""}`}>
              {inputValue || <span className="muted">…</span>}
            </div>
            <div className="numpad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"].map((k) => (
                <button
                  key={k}
                  className={`numpad-key ${k === "OK" ? "ok-key" : ""} ${k === "⌫" ? "del-key" : ""}`}
                  disabled={!!answered || (k === "OK" && !inputValue.trim())}
                  onClick={() => numpadPress(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </>
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
                {fact && (
                  <p className="funfact">
                    <span className="funfact-label">Trouvaille du sentier</span>
                    {fact}
                  </p>
                )}
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
