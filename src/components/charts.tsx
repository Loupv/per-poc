// Composants de visualisation — SVG natif, sans dépendance.
// Statuts (palette validée CVD, ordre fixe acquis → en cours → à revoir) :
//   acquis #166534 · en cours #d19000 · à revoir #d64545 · à positionner = piste neutre.
// Les nombres sont toujours donnés en texte à côté (jamais la couleur seule).

import type { DomainStats } from "../lib/engine";

export const STATUS_COLORS = {
  mastered: "#166534",
  inProgress: "#d19000",
  toReview: "#d64545",
  track: "#e4e5ea",
} as const;

const SEGMENTS = (s: DomainStats) => [
  { key: "mastered", value: s.mastered, color: STATUS_COLORS.mastered, label: "acquis" },
  { key: "inProgress", value: s.inProgress, color: STATUS_COLORS.inProgress, label: "en cours" },
  { key: "toReview", value: s.toReview, color: STATUS_COLORS.toReview, label: "à revoir" },
];

/** Barre empilée horizontale : acquis / en cours / à revoir sur piste neutre. */
export function StatusBar({ stats, height = 8 }: { stats: DomainStats; height?: number }) {
  const total = Math.max(stats.total, 1);
  return (
    <div
      className="statusbar"
      style={{ height }}
      role="img"
      aria-label={`${stats.mastered} acquis, ${stats.inProgress} en cours, ${stats.toReview} à revoir, ${stats.toPosition} à positionner, sur ${stats.total} étapes`}
    >
      {SEGMENTS(stats)
        .filter((seg) => seg.value > 0)
        .map((seg) => (
          <span
            key={seg.key}
            className="statusbar-seg"
            title={`${seg.value} ${seg.label}`}
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
          />
        ))}
    </div>
  );
}

/** Donut de répartition avec % d'acquis au centre. */
export function Donut({ stats, size = 92 }: { stats: DomainStats; size?: number }) {
  const total = Math.max(stats.total, 1);
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const gap = 2.5; // séparateur entre segments, en px de circonférence

  let offset = 0;
  const arcs = SEGMENTS(stats)
    .filter((seg) => seg.value > 0)
    .map((seg) => {
      const len = (seg.value / total) * c;
      const arc = { ...seg, dash: Math.max(len - gap, 0.5), start: offset };
      offset += len;
      return arc;
    });

  const pct = Math.round((stats.mastered / total) * 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="donut"
      role="img"
      aria-label={`${pct}% d'étapes acquises`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={STATUS_COLORS.track} strokeWidth="10" />
      {arcs.map((a) => (
        <circle
          key={a.key}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth="10"
          strokeDasharray={`${a.dash} ${c - a.dash}`}
          strokeDashoffset={-a.start}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        >
          <title>{`${a.value} ${a.label}`}</title>
        </circle>
      ))}
      <text x="50%" y="46%" textAnchor="middle" className="donut-pct">
        {pct}%
      </text>
      <text x="50%" y="62%" textAnchor="middle" className="donut-sub">
        acquis
      </text>
    </svg>
  );
}

/** Évolution des scores aux contrôles (en % de réussite). */
export function ScoreLine({ points }: { points: { label: string; pct: number }[] }) {
  const w = 320;
  const h = 96;
  const px = 26;
  const py = 12;
  const n = points.length;
  const x = (i: number) => px + (n === 1 ? (w - 2 * px) / 2 : (i * (w - 2 * px)) / (n - 1));
  const y = (pct: number) => h - py - (pct / 100) * (h - 2 * py);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.pct)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="scoreline" role="img" aria-label="Évolution des scores aux contrôles">
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={px} x2={w - px} y1={y(g)} y2={y(g)} className="scoreline-grid" />
          <text x={px - 5} y={y(g) + 3} textAnchor="end" className="scoreline-tick">
            {g}
          </text>
        </g>
      ))}
      {n > 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.pct)} r="4" fill="var(--accent)">
          <title>{`${p.label} : ${p.pct}%`}</title>
        </circle>
      ))}
      {n > 0 && (
        <text x={x(n - 1) + 8} y={y(points[n - 1].pct) + 3} className="scoreline-last">
          {points[n - 1].pct}%
        </text>
      )}
    </svg>
  );
}
