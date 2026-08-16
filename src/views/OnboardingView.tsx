import { useState } from "react";
import { addChild, setRole } from "../store";
import type { AppStore, Role } from "../types";

const YEARS = [5, 6, 7, 8];

export function OnboardingView({ store }: { store: AppStore }) {
  const [role, setLocalRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [year, setYear] = useState(6);

  // Choix du rôle
  if (!role) {
    return (
      <div className="card welcome">
        <h1>Bienvenue ! 👋</h1>
        <p>Révisions et fiches alignées sur le programme officiel de l'école (PER).</p>
        <p className="muted">Pour commencer, dis-nous qui tu es :</p>
        <div className="role-cards">
          <button
            className="role-card"
            onClick={() => {
              // Profil déjà créé (ex. par un parent) : l'enfant entre directement
              if (store.children.length > 0) {
                setRole("child");
              } else setLocalRole("child");
            }}
          >
            <span className="role-emoji">🧒</span>
            <strong>Je suis l'enfant</strong>
            <span className="muted">Missions, quizz et fiches de révision</span>
          </button>
          <button
            className="role-card"
            onClick={() => {
              if (store.children.length > 0) {
                setRole("parent");
              } else setLocalRole("parent");
            }}
          >
            <span className="role-emoji">👪</span>
            <strong>Je suis un parent</strong>
            <span className="muted">Positionnement, validation et suivi de progression</span>
          </button>
        </div>
      </div>
    );
  }

  // Profil de l'enfant + niveau actuel
  const isParent = role === "parent";
  return (
    <div className="card welcome">
      <h1>{isParent ? "Le profil de votre enfant" : "Ton profil"} ✏️</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addChild(name.trim(), year);
          setRole(role);
        }}
      >
        <label htmlFor="child-name">{isParent ? "Son prénom" : "Comment tu t'appelles ?"}</label>
        <div className="row">
          <input
            id="child-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isParent ? "Prénom de l'enfant" : "Ton prénom"}
            autoFocus
          />
        </div>
        <label className="year-label">
          {isParent ? "Son niveau actuel (année scolaire en cours)" : "En quelle année es-tu ?"}
        </label>
        <div className="row year-row">
          {YEARS.map((y) => (
            <button
              key={y}
              type="button"
              className={`year-chip ${year === y ? "selected" : ""}`}
              onClick={() => setYear(y)}
            >
              {y}P
            </button>
          ))}
        </div>
        <p className="muted small">
          {isParent
            ? "Après cette étape, vous pourrez indiquer ce qui a déjà été vu en classe : c'est ce qui cible les missions de révision."
            : "Un parent pourra ensuite indiquer ce que tu as déjà vu en classe."}
        </p>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => setLocalRole(null)}>
            ← Retour
          </button>
          <button className="btn primary big" type="submit" disabled={!name.trim()}>
            {isParent ? "Créer le profil" : "C'est parti !"}
          </button>
        </div>
      </form>
    </div>
  );
}
