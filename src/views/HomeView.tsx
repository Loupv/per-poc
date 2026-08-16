import { useState } from "react";
import type { Route } from "../App";
import { THEMES } from "../data/content";
import { setChild, themeStatus } from "../store";
import type { AppStore, Domain, Theme } from "../types";

const STATUS_LABEL = { none: "À découvrir", started: "En cours", mastered: "Maîtrisé ✓" } as const;

function ThemeCard({ theme, store, go }: { theme: Theme; store: AppStore; go: (r: Route) => void }) {
  const result = store.results[theme.id];
  const status = themeStatus(result);
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
        <span className="per-chip" title="Objectif du Plan d'études romand">{theme.perCode}</span>
        <span className={`status status-${status}`}>
          {STATUS_LABEL[status]}
          {result ? ` · ${result.best}/${result.total}` : ""}
        </span>
      </div>
      <div className="theme-actions">
        <button className="btn ghost" onClick={() => go({ view: "fiche", id: theme.id })}>
          📚 Fiche
        </button>
        <button className="btn primary" onClick={() => go({ view: "quiz", id: theme.id })}>
          ▶ Quizz
        </button>
      </div>
    </div>
  );
}

function DomainSection({ domain, title, store, go }: {
  domain: Domain; title: string; store: AppStore; go: (r: Route) => void;
}) {
  const themes = THEMES.filter((t) => t.domain === domain);
  const mastered = themes.filter((t) => themeStatus(store.results[t.id]) === "mastered").length;
  return (
    <section className="domain-section">
      <div className="domain-title">
        <h2>{title}</h2>
        <span className="muted">{mastered}/{themes.length} maîtrisés</span>
      </div>
      <div className="grid">
        {themes.map((t) => (
          <ThemeCard key={t.id} theme={t} store={store} go={go} />
        ))}
      </div>
    </section>
  );
}

export function HomeView({ store, go }: { store: AppStore; go: (r: Route) => void }) {
  const [name, setName] = useState("");

  if (!store.child) {
    return (
      <div className="card welcome">
        <h1>Salut ! 👋</h1>
        <p>Ici, tu peux réviser ce que tu apprends en 6P et montrer tes progrès.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setChild(name.trim());
          }}
        >
          <label htmlFor="child-name">Comment tu t'appelles ?</label>
          <div className="row">
            <input
              id="child-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton prénom"
              autoFocus
            />
            <button className="btn primary" type="submit" disabled={!name.trim()}>
              C'est parti !
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <h1 className="hello">Salut {store.child} ! Prêt·e à réviser ? 🚀</h1>
      <DomainSection domain="maths" title="🧮 Mathématiques" store={store} go={go} />
      <DomainSection domain="francais" title="📝 Français" store={store} go={go} />
    </>
  );
}
