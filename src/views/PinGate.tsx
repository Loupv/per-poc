import { useState } from "react";
import { verifyPin } from "../lib/pin";
import { resetAll } from "../store";

/** Écran de verrouillage de l'espace parents (PIN à 4 chiffres). */
export function PinGate({ pinHash, onUnlock, onCancel }: {
  pinHash: string;
  onUnlock: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async (value: string) => {
    setChecking(true);
    const ok = await verifyPin(value, pinHash);
    setChecking(false);
    if (ok) onUnlock();
    else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="card welcome pin-gate">
      <h1>🔒 Espace parents</h1>
      <p className="muted">Entre le code PIN parent pour continuer.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.length === 4) submit(pin);
        }}
      >
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={pin}
          autoFocus
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setPin(v);
            setError(false);
            if (v.length === 4) submit(v);
          }}
          placeholder="••••"
          aria-label="Code PIN parent"
        />
        {error && <p className="pin-error">Code incorrect, réessaie.</p>}
        <div className="row center" style={{ marginTop: 14 }}>
          <button className="btn ghost" type="button" onClick={onCancel} disabled={checking}>
            ← Rester en mode enfant
          </button>
        </div>
      </form>
      <p className="muted small" style={{ marginTop: 18 }}>
        Code oublié ? Sans compte, il ne peut pas être récupéré :{" "}
        <button
          className="linklike"
          onClick={() => {
            if (
              window.confirm(
                "Réinitialiser l'appareil ? TOUS les profils et toute la progression seront effacés."
              )
            )
              resetAll();
          }}
        >
          réinitialiser l'appareil
        </button>
        .
      </p>
    </div>
  );
}
