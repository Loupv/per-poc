import { useState } from "react";
import { themeById } from "./data/content";
import type { MissionQuestion } from "./lib/engine";
import { useStore } from "./store";
import { DashboardView } from "./views/DashboardView";
import { FicheView } from "./views/FicheView";
import { HomeView } from "./views/HomeView";
import { MissionView } from "./views/MissionView";
import { ProgrammeView } from "./views/ProgrammeView";

export type Route =
  | { view: "home" }
  | { view: "fiche"; id: string }
  | { view: "mission"; title: string; questions: MissionQuestion[]; emoji: string }
  | { view: "programme"; year?: number }
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
          <span className="brand-badge">{store.child ? `${store.child.year}P` : "PER"}</span> Mes révisions
        </button>
        <nav className="topnav">
          <button
            className={`nav-parent ${route.view === "programme" ? "active" : ""}`}
            onClick={() => go({ view: "programme" })}
          >
            🗺️ Programme
          </button>
          <button
            className={`nav-parent ${route.view === "dashboard" ? "active" : ""}`}
            onClick={() => go({ view: "dashboard" })}
          >
            👪 Parents
          </button>
        </nav>
      </header>

      <main>
        {route.view === "home" && <HomeView store={store} go={go} />}
        {route.view === "fiche" && themeById(route.id) && (
          <FicheView theme={themeById(route.id)!} go={go} />
        )}
        {route.view === "mission" && (
          <MissionView key={route.title} title={route.title} emoji={route.emoji} questions={route.questions} go={go} />
        )}
        {route.view === "programme" && <ProgrammeView store={store} go={go} initialYear={route.year} />}
        {route.view === "dashboard" && <DashboardView store={store} go={go} />}
      </main>

      <footer className="footer">
        POC — référentiel complet du Plan d'études romand (PER, cycle 2), 453 étapes officielles.
        Données PER © CIIP, via l'API publique per.ciip.ch. Démo sans compte, progression enregistrée
        sur cet appareil.
      </footer>
    </div>
  );
}
