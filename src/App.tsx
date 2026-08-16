import { useState } from "react";
import { THEMES, themeById } from "./data/content";
import { useStore } from "./store";
import { HomeView } from "./views/HomeView";
import { FicheView } from "./views/FicheView";
import { QuizView } from "./views/QuizView";
import { DashboardView } from "./views/DashboardView";

export type Route =
  | { view: "home" }
  | { view: "fiche"; id: string }
  | { view: "quiz"; id: string }
  | { view: "dashboard" };

export default function App() {
  const [route, setRoute] = useState<Route>({ view: "home" });
  const store = useStore();

  const go = (r: Route) => {
    setRoute(r);
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go({ view: "home" })}>
          <span className="brand-badge">6P</span> Mes révisions
        </button>
        <button
          className={`nav-parent ${route.view === "dashboard" ? "active" : ""}`}
          onClick={() => go({ view: "dashboard" })}
        >
          👪 Espace parents
        </button>
      </header>

      <main>
        {route.view === "home" && <HomeView store={store} go={go} />}
        {route.view === "fiche" && themeById(route.id) && (
          <FicheView theme={themeById(route.id)!} go={go} />
        )}
        {route.view === "quiz" && themeById(route.id) && (
          <QuizView key={route.id} theme={themeById(route.id)!} go={go} />
        )}
        {route.view === "dashboard" && <DashboardView store={store} go={go} />}
      </main>

      <footer className="footer">
        POC — contenus alignés sur le Plan d'études romand (PER, cycle 2, 6e année).
        Données PER © CIIP, via l'API publique per.ciip.ch. {THEMES.length} thèmes ·
        démo sans compte, progression enregistrée sur cet appareil.
      </footer>
    </div>
  );
}
