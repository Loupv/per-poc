// Mode éclair : 60 secondes de calcul rapide, au choix de l'enfant.
// Pas de record ni de classement — le temps est un jouet, pas une pression.

import { useEffect, useRef, useState } from "react";
import type { Route } from "../App";
import { IconCheck, IconCross } from "../components/icons";
import { ECLAIR_STEP, makeEclairQuestion } from "../lib/generators";
import { recordPractice, recordSession } from "../store";
import type { Question } from "../types";

const DURATION = 60;

export function EclairView({ childId, go }: { childId: string; go: (r: Route) => void }) {
  const [q, setQ] = useState<Question>(() => makeEclairQuestion());
  const [left, setLeft] = useState(DURATION);
  const [good, setGood] = useState(0);
  const [total, setTotal] = useState(0);
  const [flash, setFlash] = useState<null | boolean>(null);
  const done = left <= 0;
  const recorded = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (done && !recorded.current && total > 0) {
      recorded.current = true;
      recordSession(childId, "Mode éclair", good, total);
    }
  }, [done, childId, good, total]);

  const answer = (i: number) => {
    if (done) return;
    const correct = i === q.answerIndex;
    recordPractice(childId, ECLAIR_STEP[q.id] ?? 4955, correct, q.id);
    setGood((g) => g + (correct ? 1 : 0));
    setTotal((t) => t + 1);
    setFlash(correct);
    setTimeout(() => setFlash(null), 250);
    setQ(makeEclairQuestion());
  };

  if (done) {
    return (
      <div className="quiz-end">
        <h1>Temps écoulé !</h1>
        <p className="score-big">
          {good} juste{good > 1 ? "s" : ""} sur {total}
        </p>
        <p className="muted">
          {good >= 15
            ? "Tes livrets fusent — impressionnant."
            : good >= 8
              ? "Belle cadence ! Les livrets rentrent."
              : "L'éclair se muscle en s'entraînant — reviens quand tu veux !"}
        </p>
        <div className="row center">
          <button className="btn primary" onClick={() => go({ view: "home" })}>
            Accueil
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setLeft(DURATION);
              setGood(0);
              setTotal(0);
              recorded.current = false;
              setQ(makeEclairQuestion());
            }}
          >
            Encore 60 secondes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz eclair">
      <button className="btn back" onClick={() => go({ view: "home" })}>
        ← Quitter
      </button>
      <div className="quiz-progress">
        <div className="quiz-progress-bar eclair-bar" style={{ width: `${(left / DURATION) * 100}%` }} />
      </div>
      <p className="muted quiz-counter">
        Mode éclair · {left} s · {good}/{total} justes
      </p>

      <div className={`card question-card eclair-card ${flash === true ? "flash-ok" : flash === false ? "flash-ko" : ""}`}>
        <h2 className="eclair-prompt">
          {q.prompt}
          {flash !== null && (
            <span className={`flash-mark ${flash ? "ok" : "ko"}`}>
              {flash ? <IconCheck size={18} /> : <IconCross size={18} />}
            </span>
          )}
        </h2>
        <div className="choices eclair-choices">
          {q.choices!.map((c, i) => (
            <button key={`${c}-${i}`} className="choice" onClick={() => answer(i)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
