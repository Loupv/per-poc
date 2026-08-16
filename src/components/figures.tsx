// Figures SVG paramétriques pour les questions — dessinées inline, même style
// que les icônes (traits currentColor), pas d'assets externes.
import type { ReactNode } from "react";

const F = ({ w = 160, h = 110, children }: { w?: number; h?: number; children: ReactNode }) => (
  <svg
    viewBox={`0 0 ${w} ${h}`}
    className="figure"
    role="img"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const fill = "rgba(59, 91, 219, 0.08)";

export const FIGURES: Record<string, ReactNode> = {
  carre: (
    <F>
      <rect x="55" y="30" width="50" height="50" fill={fill} />
    </F>
  ),
  rectangle: (
    <F>
      <rect x="40" y="35" width="80" height="42" fill={fill} />
    </F>
  ),
  losange: (
    <F>
      <path d="M80 18 L118 55 L80 92 L42 55 Z" fill={fill} />
    </F>
  ),
  triangle: (
    <F>
      <path d="M80 22 L120 88 L40 88 Z" fill={fill} />
    </F>
  ),
  cercle: (
    <F>
      <circle cx="80" cy="55" r="34" fill={fill} />
    </F>
  ),
  paralleles: (
    <F>
      <path d="M30 80 L110 25" />
      <path d="M55 92 L135 37" />
    </F>
  ),
  perpendiculaires: (
    <F>
      <path d="M25 55 L135 55" />
      <path d="M80 8 L80 102" />
      <path d="M80 45 h10 v10" strokeWidth="1.8" />
    </F>
  ),
  secantes: (
    <F>
      <path d="M25 85 L135 35" />
      <path d="M45 20 L115 95" />
    </F>
  ),
  cube: (
    <F>
      <rect x="45" y="35" width="46" height="46" fill={fill} />
      <path d="M45 35 L67 18 L113 18 L91 35" />
      <path d="M113 18 L113 64 L91 81" />
    </F>
  ),
  pyramide: (
    <F>
      <path d="M80 15 L120 85 L40 85 Z" fill={fill} />
      <path d="M80 15 L98 78 L120 85" strokeWidth="1.8" />
      <path d="M40 85 L98 78" strokeWidth="1.8" strokeDasharray="4 4" />
    </F>
  ),
  pave: (
    <F>
      <rect x="30" y="42" width="70" height="40" fill={fill} />
      <path d="M30 42 L52 25 L122 25 L100 42" />
      <path d="M122 25 L122 65 L100 82" />
    </F>
  ),
  regle7: (
    <F w={220} h={90}>
      <path d="M30 30 L170 30" strokeWidth="3.5" stroke="#d64545" />
      <circle cx="30" cy="30" r="3" fill="#d64545" stroke="none" />
      <circle cx="170" cy="30" r="3" fill="#d64545" stroke="none" />
      <rect x="20" y="48" width="190" height="32" fill={fill} strokeWidth="1.5" />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} strokeWidth="1.5">
          <path d={`M${30 + i * 20} 48 v8`} />
          <text
            x={30 + i * 20}
            y={74}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            stroke="none"
            fontFamily="inherit"
          >
            {i}
          </text>
        </g>
      ))}
    </F>
  ),
  "grille-ab": (
    <F w={180} h={120}>
      {Array.from({ length: 5 }, (_, i) => (
        <path key={`v${i}`} d={`M${30 + i * 30} 15 V105`} strokeWidth="1" opacity="0.35" />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <path key={`h${i}`} d={`M30 ${15 + i * 30} H150`} strokeWidth="1" opacity="0.35" />
      ))}
      <circle cx="30" cy="75" r="6" fill="#3b5bdb" stroke="none" />
      <text x="30" y="97" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" stroke="none" fontFamily="inherit">
        A
      </text>
      <circle cx="90" cy="45" r="6" fill="#166534" stroke="none" />
      <text x="90" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" stroke="none" fontFamily="inherit">
        B
      </text>
    </F>
  ),
};

export const Figure = ({ id }: { id: string }) => (
  <div className="q-figure">{FIGURES[id] ?? null}</div>
);
