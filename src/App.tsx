import { useState } from "react";
import { themeById } from "./data/content";
import type { MissionQuestion } from "./lib/engine";
import { activeChild, setRole, useStore } from "./store";
import type { RunMode } from "./views/MissionView";
import { DashboardView } from "./views/DashboardView";
import { FicheView } from "./views/FicheView";
import { HomeView } from "./views/HomeView";
import { MissionView } from "./views/MissionView";
import { OnboardingView } from "./views/OnboardingView";
import { ParentHomeView } from "./views/ParentHomeView";
import { PinGate } from "./views/PinGate";
import { ProgrammeView } from "./views/ProgrammeView";

export type Route =
  | { view: "home" }
  | { view: "fiche"; id: string }
  | {
      view: "mission";
      mode: RunMode;
      planId?: string;
      title: string;
      questions: MissionQuestion[];
      emoji: string;
    }
  | { view: "programme"; year?: number }
  | { view: "dashboard" };

export default function App() {
  const [route, setRoute] = useState<Route>({ view: "home" });
  // Déverrouillage parent : en mémoire seulement — retombe au verrou à chaque
  // rechargement et à chaque passage en mode enfant.
  const [unlocked, setUnlocked] = useState(false);
  const store = useStore();
  const child = activeChild(store);

  const go = (r: Route) => {
    setRoute(r);
    window.scrollTo(0, 0);
  };

  const onboarded = store.role !== null && child !== null;
  const isParent = store.role === "parent";
  const locked = isParent && store.parentPinHash !== null && !unlocked;

  const switchRole = () => {
    if (isParent) setUnlocked(false);
    setRole(isParent ? "child" : "parent");
    go({ view: "home" });
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go({ view: "home" })}>
          <span className="brand-badge">{child ? `${child.year}P` : "PER"}</span> Mes révisions
        </button>
        {onboarded && (
          <nav className="topnav">
            <button
              className={`nav-parent ${route.view === "programme" ? "active" : ""}`}
              onClick={() => go({ view: "programme" })}
            >
              🗺️ Programme
            </button>
            <button className="nav-parent role-switch" onClick={switchRole}>
              {isParent ? "🧒 Mode enfant" : "👪 Espace parents"}
            </button>
          </nav>
        )}
      </header>

      <main>
        {!onboarded || !child ? (
          <OnboardingView store={store} />
        ) : locked ? (
          <PinGate
            pinHash={store.parentPinHash!}
            onUnlock={() => setUnlocked(true)}
            onCancel={() => {
              setRole("child");
              go({ view: "home" });
            }}
          />
        ) : (
          <>
            {route.view === "home" &&
              (isParent ? (
                <ParentHomeView store={store} child={child} go={go} />
              ) : (
                <HomeView store={store} child={child} go={go} />
              ))}
            {route.view === "fiche" && themeById(route.id) && (
              <FicheView theme={themeById(route.id)!} go={go} />
            )}
            {route.view === "mission" && (
              <MissionView
                key={`${route.mode}-${route.title}`}
                childId={child.id}
                mode={route.mode}
                planId={route.planId ?? null}
                title={route.title}
                emoji={route.emoji}
                questions={route.questions}
                go={go}
              />
            )}
            {route.view === "programme" && (
              <ProgrammeView child={child} go={go} initialYear={route.year} canEdit={isParent} />
            )}
            {route.view === "dashboard" && <DashboardView child={child} go={go} />}
          </>
        )}
      </main>

      <footer className="footer">
        POC — référentiel complet du Plan d'études romand (PER, cycle 2), 618 étapes officielles.
        Données PER © CIIP, via l'API publique per.ciip.ch. Démo sans compte, progression enregistrée
        sur cet appareil.{" "}
        <a href="mailto:loup.vuarnesson@allhere.org?subject=Feedback%20POC%20r%C3%A9visions%20PER">
          Un avis, un bug ? Écrivez-nous
        </a>
        .
      </footer>
    </div>
  );
}
