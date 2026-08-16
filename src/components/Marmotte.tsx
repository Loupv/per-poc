// La marmotte — compagnon de sentier, pas coach.
// Elle vit sur le chemin : elle salue au départ, siffle quand il y a une trouvaille,
// dort quand il n'y a rien à faire, lève les pattes au sommet.
// Style trait, comme les icônes : 2px, currentColor, aucun gros yeux cartoon.
// Traits distinctifs de la marmotte : petites oreilles basses, museau large,
// deux incisives, corps en poire, courte queue touffue.

import type { ReactNode } from "react";

export type Pose = "salue" | "siffle" | "dort" | "sommet";

/** Tête de marmotte assise (museau, incisives, petites oreilles). */
const Head = ({ mouth }: { mouth: ReactNode }) => (
  <>
    {/* petites oreilles, basses et sur le côté */}
    <circle cx="24.5" cy="19.5" r="3" />
    <circle cx="45.5" cy="19.5" r="3" />
    {/* crâne */}
    <circle cx="35" cy="25" r="11.5" />
    {/* museau large */}
    <path d="M29 30.5c1.6 3 4 4.4 6 4.4s4.4-1.4 6-4.4" />
    {/* truffe */}
    <path d="M35 28.5v1.6" />
    <circle cx="35" cy="27.6" r="1.1" fill="currentColor" stroke="none" />
    {/* yeux */}
    <circle cx="30.6" cy="23" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="39.4" cy="23" r="1.3" fill="currentColor" stroke="none" />
    {mouth}
  </>
);

/** Les deux incisives — la signature du rongeur. */
const Teeth = () => (
  <g strokeWidth="1.6">
    <path d="M33.4 34.4v3.2M36.6 34.4v3.2" />
    <path d="M33.4 37.6h3.2" />
  </g>
);

/** Corps en poire, pattes arrière et queue. */
const Body = () => (
  <>
    <path d="M35 37c8 0 13.5 7 13.5 15.5C48.5 60 43 64 35 64s-13.5-4-13.5-11.5C21.5 44 27 37 35 37z" />
    {/* pattes arrière */}
    <path d="M27 63.5c-1.6 1.6-2.4 3-2 4M43 63.5c1.6 1.6 2.4 3 2 4" />
    {/* queue courte et touffue */}
    <path d="M48 57c4 1.5 6.5 4 7 7" />
  </>
);

export function Marmotte({ pose = "salue", size = 84 }: { pose?: Pose; size?: number }) {
  return (
    <svg
      viewBox="0 0 70 72"
      width={size}
      height={(size * 72) / 70}
      className={`marmotte pose-${pose}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Une marmotte"
    >
      {pose === "dort" && (
        <>
          {/* roulée en boule, museau posé */}
          <path d="M12 56c0-12 10-20 23-20s23 8 23 20c0 4.5-3.5 7-23 7s-23-2.5-23-7z" />
          <circle cx="24" cy="40" r="2.8" />
          <circle cx="42" cy="40" r="2.8" />
          {/* yeux fermés */}
          <path d="M28 47.5c1.3 1.2 2.5 1.2 3.8 0M35.5 47.5c1.3 1.2 2.5 1.2 3.8 0" />
          {/* museau + incisives au repos */}
          <path d="M31 53c1.4 1.6 3 2.2 4.5 2.2s3.1-.6 4.5-2.2" />
          <path d="M34.2 55.4v2M36.8 55.4v2" strokeWidth="1.5" />
          {/* queue enroulée */}
          <path d="M58 55c4-1 6-3.5 5.5-6.5" />
          {/* souffle du sommeil */}
          <path d="M52 28c2-1.4 2-3.4 0-4.8M57.5 24c2.4-1.6 2.4-4 0-5.6" opacity="0.55" />
        </>
      )}

      {pose === "salue" && (
        <>
          <Body />
          <Head mouth={<Teeth />} />
          {/* patte levée qui salue, à gauche (la queue occupe la droite) */}
          <path d="M22.5 46c-4.5-1.5-7.5-5-8-9.5" />
          <path d="M45 47c1.8 1.8 2.3 3.6 1.4 5" />
        </>
      )}

      {pose === "siffle" && (
        <>
          <Body />
          <Head mouth={<circle cx="35" cy="35.6" r="2.3" />} />
          {/* ondes du sifflement */}
          <path d="M50 22c2.6-1.8 2.6-4.6 0-6.4" />
          <path d="M56.5 19c3.4-2.4 3.4-6.2 0-8.6" />
          <path d="M25 46c-2 2-2.5 4-1.5 5.5M45 46c2 2 2.5 4 1.5 5.5" />
        </>
      )}

      {pose === "sommet" && (
        <>
          <Body />
          <Head mouth={<Teeth />} />
          {/* deux pattes levées vers le ciel */}
          <path d="M23 45c-4.5-2.5-7-6.5-7-11.5" />
          <path d="M47 45c4.5-2.5 7-6.5 7-11.5" />
        </>
      )}
    </svg>
  );
}

/** La marmotte avec une bulle de dialogue. */
export function MarmotteSays({
  pose = "salue",
  size = 76,
  children,
}: {
  pose?: Pose;
  size?: number;
  children: ReactNode;
}) {
  return (
    <div className="marmotte-says">
      <span className={`marmotte-holder pose-${pose}`}>
        <Marmotte pose={pose} size={size} />
      </span>
      <p className="marmotte-bubble">{children}</p>
    </div>
  );
}
