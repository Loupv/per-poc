import { useState } from "react";
import { hashPin, isValidPin } from "../lib/pin";
import { addChild, setParentPinHash, setRole } from "../store";
import type { AppStore, Role } from "../types";

const YEARS = [5, 6, 7, 8];

type Step = "role" | "name" | "year" | "pin";

export function OnboardingView({ store }: { store: AppStore }) {
  const [role, setLocalRole] = useState<Role | null>(null);
  const [step, setStep] = useState<Step>("role");
  const [name, setName] = useState("");
  const [year, setYear] = useState(6);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const isParent = role === "parent";
  const steps: Step[] = isParent ? ["role", "name", "year", "pin"] : ["role", "name", "year"];
  const stepIndex = steps.indexOf(step);

  const finish = async (withPin: boolean) => {
    if (withPin) {
      if (!isValidPin(pin1)) return setPinError("Le code doit faire 4 chiffres.");
      if (pin1 !== pin2) return setPinError("Les deux codes ne correspondent pas.");
      setParentPinHash(await hashPin(pin1));
    }
    addChild(name.trim(), year);
    setRole(role!);
  };

  return (
    <div className="card welcome">
      <div className="steps-dots" aria-label={`Étape ${stepIndex + 1} sur ${steps.length}`}>
        {steps.map((s, i) => (
          <span key={s} className={`dot ${i <= stepIndex ? "on" : ""}`} />
        ))}
      </div>

      {step === "role" && (
        <>
          <h1>Bienvenue</h1>
          <p className="muted">
            Révisions et suivi alignés sur le programme officiel de l'école (PER).
          </p>
          <div className="role-cards">
            <button
              className="role-card"
              onClick={() => {
                if (store.children.length > 0) setRole("child");
                else {
                  setLocalRole("child");
                  setStep("name");
                }
              }}
            >
              <span className="role-emoji">🧒</span>
              <strong>Je suis l'enfant</strong>
              <span className="muted">Missions, quizz et fiches</span>
            </button>
            <button
              className="role-card"
              onClick={() => {
                if (store.children.length > 0) setRole("parent");
                else {
                  setLocalRole("parent");
                  setStep("name");
                }
              }}
            >
              <span className="role-emoji">👪</span>
              <strong>Je suis un parent</strong>
              <span className="muted">Positionnement, contrôles et suivi</span>
            </button>
          </div>
        </>
      )}

      {step === "name" && (
        <>
          <h1>{isParent ? "Le prénom de votre enfant" : "Comment tu t'appelles ?"}</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setStep("year");
            }}
          >
            <div className="row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isParent ? "Prénom de l'enfant" : "Ton prénom"}
                autoFocus
              />
            </div>
            <div className="row wizard-nav">
              <button type="button" className="btn ghost" onClick={() => setStep("role")}>
                ← Retour
              </button>
              <button className="btn primary" type="submit" disabled={!name.trim()}>
                Continuer
              </button>
            </div>
          </form>
        </>
      )}

      {step === "year" && (
        <>
          <h1>{isParent ? `Le niveau actuel de ${name.trim()}` : "En quelle année es-tu ?"}</h1>
          <p className="muted">L'année scolaire en cours détermine le programme et les missions.</p>
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
          <div className="row wizard-nav">
            <button type="button" className="btn ghost" onClick={() => setStep("name")}>
              ← Retour
            </button>
            {isParent ? (
              <button className="btn primary" onClick={() => setStep("pin")}>
                Continuer
              </button>
            ) : (
              <button className="btn primary" onClick={() => finish(false)}>
                C'est parti !
              </button>
            )}
          </div>
        </>
      )}

      {step === "pin" && (
        <>
          <h1>Un code PIN parent ?</h1>
          <p className="muted">
            Recommandé : il protège l'espace parents (résultats, contrôles) sur cet appareil.
            4 chiffres.
          </p>
          <div className="row">
            <input
              className="pin-input small"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Code"
              value={pin1}
              onChange={(e) => {
                setPin1(e.target.value.replace(/\D/g, "").slice(0, 4));
                setPinError(null);
              }}
              autoFocus
            />
            <input
              className="pin-input small"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Confirmer"
              value={pin2}
              onChange={(e) => {
                setPin2(e.target.value.replace(/\D/g, "").slice(0, 4));
                setPinError(null);
              }}
            />
          </div>
          {pinError && <p className="pin-error">{pinError}</p>}
          <div className="row wizard-nav">
            <button type="button" className="btn ghost" onClick={() => setStep("year")}>
              ← Retour
            </button>
            <button className="btn ghost" onClick={() => finish(false)}>
              Plus tard
            </button>
            <button className="btn primary" disabled={pin1.length < 4} onClick={() => finish(true)}>
              Créer avec le code
            </button>
          </div>
        </>
      )}
    </div>
  );
}
