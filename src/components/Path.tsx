// Le chemin : le programme de l'année comme un sentier de nœuds à parcourir.
// Le prochain nœud est mis en avant ; les faits sont colorés ; les « pas encore
// vu en classe » sont estompés mais restent jouables (s'entraîner est libre).

import { IconCheck, ThemeIcon } from "./icons";
import { DOMAIN_LABEL, buildPath, nodeQuestions } from "../lib/engine";
import type { ChildProfile, Domain } from "../types";
import type { Route } from "../App";

const DOMAIN_THEME_ICON: Record<Domain, string> = {
  maths: "math-nombres",
  francais: "fr-comprehension",
  sciences: "sc-vivant",
  shs: "shs-geo",
};

// décalages latéraux cycliques, façon sentier
const OFFSETS = [0, 52, 0, -52];
/** Écart vertical entre deux balises (marge + hauteur du nœud), en pixels. */
const ROW_GAP = 80;

export function Path({ child, go }: { child: ChildProfile; go: (r: Route) => void }) {
  const nodes = buildPath(child);
  let lastDomain: Domain | null = null;
  let i = 0;

  return (
    <div className="path">
      {nodes.map((node) => {
        const domainHeader = node.domain !== lastDomain;
        if (domainHeader) {
          lastDomain = node.domain;
          i = 0;
        }
        const offset = OFFSETS[i % OFFSETS.length];
        // segment pointillé vers la balise suivante (sauf en fin de matière)
        const nextNode = nodes[nodes.indexOf(node) + 1];
        const sameDomain = nextNode && nextNode.domain === node.domain;
        const dx = sameDomain ? OFFSETS[(i + 1) % OFFSETS.length] - offset : 0;
        const trailLen = sameDomain ? Math.hypot(dx, ROW_GAP) : 0;
        const trailAngle = sameDomain ? (Math.atan2(dx, ROW_GAP) * 180) / Math.PI : 0;
        i++;
        return (
          <div key={node.id}>
            {domainHeader && (
              <div className={`path-domain ${node.domain}`}>
                <span className="path-domain-icon">
                  <ThemeIcon themeId={DOMAIN_THEME_ICON[node.domain]} size={16} />
                </span>
                {DOMAIN_LABEL[node.domain]}
              </div>
            )}
            <div className="path-row" style={{ transform: `translateX(${offset}px)` }}>
              <button
                style={
                  {
                    "--trail-len": `${trailLen}px`,
                    "--trail-angle": `${-trailAngle}deg`,
                  } as React.CSSProperties
                }
                className={`path-node ${node.domain} ${node.state} ${node.unseen ? "unseen" : ""}`}
                title={node.unseen ? `${node.label} — pas encore vu en classe` : node.label}
                onClick={() => {
                  const qs = nodeQuestions(child, node);
                  if (qs.length)
                    go({ view: "mission", mode: "practice", title: node.label, questions: qs });
                }}
              >
                {node.state === "done" ? (
                  <IconCheck size={22} />
                ) : (
                  /* balise de randonnée suisse : blanc-rouge-blanc */
                  <span className="balise" aria-hidden="true">
                    <span className="balise-red" />
                  </span>
                )}
              </button>
              <span className={`path-label ${node.state === "current" ? "strong" : "muted"}`}>
                {node.label}
                {node.state === "current" && <span className="path-here"> — c'est ici !</span>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
