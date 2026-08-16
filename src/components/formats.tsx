// Formats d'exercices interactifs — tout au tap, sans dépendance.
// Chaque composant gère son état interne et appelle onSubmit(correct) une seule fois.
import { useMemo, useState } from "react";
import type { Question } from "../types";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Mélange en garantissant un ordre différent de l'original (si possible). */
const shuffledDifferent = <T,>(arr: T[]): T[] => {
  if (arr.length < 2) return [...arr];
  for (let tries = 0; tries < 10; tries++) {
    const s = shuffle(arr);
    if (s.some((v, i) => v !== arr[i])) return s;
  }
  return [...arr].reverse();
};

/** Texte de la bonne réponse, pour le feedback d'entraînement. */
export function correctAnswerText(q: Question): string | null {
  switch (q.type) {
    case "multi":
      return (q.correctIndices ?? []).map((i) => q.choices![i]).join(" · ");
    case "order":
      return (q.items ?? []).join(" → ");
    case "match":
      return (q.pairs ?? []).map(([l, r]) => `${l} ↔ ${r}`).join(" · ");
    case "sort":
      return (q.buckets ?? []).map((b) => `${b.name} : ${b.items.join(", ")}`).join(" — ");
    default:
      return null;
  }
}

/** Choix multiples : cocher TOUTES les bonnes réponses. */
export function MultiChoice({ q, disabled, onSubmit }: {
  q: Question;
  disabled: boolean;
  onSubmit: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const correct = new Set(q.correctIndices ?? []);

  return (
    <>
      <p className="muted small format-hint">Coche toutes les bonnes réponses.</p>
      <div className="choices">
        {q.choices!.map((c, i) => {
          let cls = "choice multi";
          if (selected.has(i)) cls += " picked";
          if (disabled) {
            if (correct.has(i)) cls += " correct";
            else if (selected.has(i)) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button
              key={c}
              className={cls}
              disabled={disabled}
              aria-pressed={selected.has(i)}
              onClick={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  return n;
                })
              }
            >
              <span className={`checkmark ${selected.has(i) ? "on" : ""}`} />
              {c}
            </button>
          );
        })}
      </div>
      {!disabled && (
        <button
          className="btn primary format-validate"
          disabled={selected.size === 0}
          onClick={() =>
            onSubmit(selected.size === correct.size && [...selected].every((i) => correct.has(i)))
          }
        >
          Valider
        </button>
      )}
    </>
  );
}

/** Remise en ordre : taper les éléments dans le bon ordre. */
export function OrderList({ q, disabled, onSubmit }: {
  q: Question;
  disabled: boolean;
  onSubmit: (correct: boolean) => void;
}) {
  const pool = useMemo(() => shuffledDifferent(q.items ?? []), [q.id]);
  const [placed, setPlaced] = useState<string[]>([]);

  const remaining = pool.filter((it) => !placed.includes(it));

  return (
    <>
      <p className="muted small format-hint">Tape les éléments dans le bon ordre.</p>
      <div
        className="order-placed"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const it = e.dataTransfer.getData("text/plain");
          if (it && !placed.includes(it) && !disabled) setPlaced((p) => [...p, it]);
        }}
      >
        {placed.length === 0 && <span className="muted small">— commence par le premier —</span>}
        {placed.map((it, i) => (
          <button
            key={it}
            className="chip placed"
            disabled={disabled}
            title="Retirer"
            onClick={() => setPlaced((p) => p.filter((x) => x !== it))}
          >
            <span className="chip-num">{i + 1}</span> {it}
          </button>
        ))}
      </div>
      <div className="order-pool">
        {remaining.map((it) => (
          <button
            key={it}
            className="chip draggable"
            disabled={disabled}
            draggable={!disabled}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", it)}
            onClick={() => setPlaced((p) => [...p, it])}
          >
            {it}
          </button>
        ))}
      </div>
      {!disabled && (
        <button
          className="btn primary format-validate"
          disabled={placed.length !== (q.items ?? []).length}
          onClick={() => onSubmit(placed.every((it, i) => it === q.items![i]))}
        >
          Valider
        </button>
      )}
    </>
  );
}

/** Association de paires : taper un élément de gauche puis sa réponse à droite. */
export function MatchPairs({ q, disabled, onSubmit }: {
  q: Question;
  disabled: boolean;
  onSubmit: (correct: boolean) => void;
}) {
  const pairs = q.pairs ?? [];
  const rights = useMemo(() => shuffledDifferent(pairs.map(([, r]) => r)), [q.id]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const linkedRights = new Set(Object.values(links));

  return (
    <>
      <p className="muted small format-hint">
        Tape un élément à gauche, puis sa correspondance à droite.
      </p>
      <div className="match-grid">
        <div className="match-col">
          {pairs.map(([l]) => (
            <button
              key={l}
              className={`chip ${activeLeft === l ? "active" : ""} ${links[l] ? "linked" : ""}`}
              disabled={disabled}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const r = e.dataTransfer.getData("text/plain");
                if (r && !disabled) setLinks((prev) => ({ ...prev, [l]: r }));
              }}
              onClick={() => {
                if (links[l]) {
                  setLinks(({ [l]: _removed, ...rest }) => rest);
                  setActiveLeft(l);
                } else setActiveLeft(l);
              }}
            >
              {l}
              {links[l] && <span className="link-to"> → {links[l]}</span>}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rights.map((r) => (
            <button
              key={r}
              className={`chip draggable ${linkedRights.has(r) ? "dim" : ""}`}
              disabled={disabled || linkedRights.has(r)}
              draggable={!disabled && !linkedRights.has(r)}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", r)}
              onClick={() => {
                if (!activeLeft) return;
                setLinks((prev) => ({ ...prev, [activeLeft]: r }));
                setActiveLeft(null);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {!disabled && (
        <button
          className="btn primary format-validate"
          disabled={Object.keys(links).length !== pairs.length}
          onClick={() => onSubmit(pairs.every(([l, r]) => links[l] === r))}
        >
          Valider
        </button>
      )}
    </>
  );
}

/** Tri par catégories : taper un élément, puis sa catégorie. */
export function SortBuckets({ q, disabled, onSubmit }: {
  q: Question;
  disabled: boolean;
  onSubmit: (correct: boolean) => void;
}) {
  const buckets = q.buckets ?? [];
  const allItems = useMemo(() => shuffle(buckets.flatMap((b) => b.items)), [q.id]);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const unassigned = allItems.filter((it) => !assign[it]);

  return (
    <>
      <p className="muted small format-hint">Tape un élément, puis sa catégorie.</p>
      <div className="sort-pool">
        {unassigned.map((it) => (
          <button
            key={it}
            className={`chip draggable ${activeItem === it ? "active" : ""}`}
            disabled={disabled}
            draggable={!disabled}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", it)}
            onClick={() => setActiveItem(it)}
          >
            {it}
          </button>
        ))}
        {unassigned.length === 0 && <span className="muted small">tout est rangé !</span>}
      </div>
      <div className="sort-buckets">
        {buckets.map((b) => (
          <div
            key={b.name}
            className={`bucket ${activeItem && !disabled ? "ready" : ""}`}
            role="button"
            tabIndex={activeItem && !disabled ? 0 : -1}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const it = e.dataTransfer.getData("text/plain");
              if (it && !disabled) {
                setAssign((prev) => ({ ...prev, [it]: b.name }));
                setActiveItem(null);
              }
            }}
            onClick={() => {
              if (!activeItem || disabled) return;
              setAssign((prev) => ({ ...prev, [activeItem]: b.name }));
              setActiveItem(null);
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && activeItem && !disabled) {
                setAssign((prev) => ({ ...prev, [activeItem]: b.name }));
                setActiveItem(null);
              }
            }}
          >
            <strong>{b.name}</strong>
            <span className="bucket-items">
              {allItems
                .filter((it) => assign[it] === b.name)
                .map((it) => (
                  <button
                    key={it}
                    className="chip mini"
                    disabled={disabled}
                    title="Retirer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssign(({ [it]: _removed, ...rest }) => rest);
                    }}
                  >
                    {it}
                  </button>
                ))}
            </span>
          </div>
        ))}
      </div>
      {!disabled && (
        <button
          className="btn primary format-validate"
          disabled={unassigned.length > 0}
          onClick={() =>
            onSubmit(buckets.every((b) => b.items.every((it) => assign[it] === b.name)))
          }
        >
          Valider
        </button>
      )}
    </>
  );
}
