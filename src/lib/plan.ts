// Tiers d'abonnement — PRÉCÂBLAGE UNIQUEMENT pour le POC.
// Tout est débloqué (CURRENT_TIER = le plus haut), mais chaque fonctionnalité
// payante passe déjà par ces entitlements : brancher un vrai paywall se fera ici,
// sans toucher aux vues.

export type Tier = "gratuit" | "plus" | "famille";

export interface Entitlements {
  /** Nombre maximum de profils enfants. */
  maxChildren: number;
  /** Planification de contrôles par les parents. */
  canPlanTests: boolean;
  /** Recommandations personnalisées. */
  canSeeRecommendations: boolean;
  /** Retest des années précédentes. */
  canRetestPastYears: boolean;
}

export const TIERS: Record<Tier, Entitlements> = {
  gratuit: {
    maxChildren: 1,
    canPlanTests: false,
    canSeeRecommendations: false,
    canRetestPastYears: false,
  },
  plus: {
    maxChildren: 1,
    canPlanTests: true,
    canSeeRecommendations: true,
    canRetestPastYears: true,
  },
  famille: {
    maxChildren: 4,
    canPlanTests: true,
    canSeeRecommendations: true,
    canRetestPastYears: true,
  },
};

export const TIER_LABEL: Record<Tier, string> = {
  gratuit: "Gratuit",
  plus: "Plus",
  famille: "Famille",
};

/** POC : tout débloqué. Le paywall réel remplacera cette constante. */
export const CURRENT_TIER: Tier = "famille";

export const entitlements: Entitlements = TIERS[CURRENT_TIER];

/** Tier minimum offrant une capacité donnée (pour l'affichage des badges). */
export const tierFor = (check: (e: Entitlements) => boolean): Tier => {
  for (const t of ["gratuit", "plus", "famille"] as Tier[]) if (check(TIERS[t])) return t;
  return "famille";
};
