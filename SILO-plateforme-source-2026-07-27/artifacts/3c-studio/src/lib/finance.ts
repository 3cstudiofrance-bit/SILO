/**
 * Presentation financiere cote interface.
 * Les calculs partages et testes vivent dans @workspace/domain.
 */
import {
  FRP_ANNUAL_TX_THRESHOLD,
  computeSplit,
  frpOutcome,
} from "@workspace/domain";

export {
  ADVISOR_MAX_ACTIVE_PROJECTS,
  ADVISOR_PARTNER_PORTFOLIO_TARGET,
  ADVISOR_WARNING_ACTIVE_PROJECTS,
  FINANCIAL_CALCULATION_VERSION,
  FRP_ANNUAL_TX_THRESHOLD,
  QUOTE_FLOOR_ABONNEMENT_HT,
  QUOTE_FLOOR_PONCTUEL_HT,
  SPLIT,
  TVA_RATE,
  computeOperationalAllocation,
  computeSplit,
  frpOutcome,
  meetsQuoteFloor,
  quoteFloorFor,
} from "@workspace/domain";
export type {
  FinancialSplit,
  OperationalAllocation,
  TransactionKind,
} from "@workspace/domain";

export function formatEUR(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

// ── PACKS RÉSEAUX SOCIAUX ─────────────────────────────────────

export interface SocialPack {
  id: string;
  name: string;
  priceHT: number;
  priceTTC: number;
  perMonth: true;
  features: string[];
}

export const SOCIAL_PACKS: SocialPack[] = [
  {
    id: "essentiel",
    name: "Pack Essentiel",
    priceHT: 690,
    priceTTC: 828,
    perMonth: true,
    features: [
      "4 vidéos courtes / mois",
      "1 journée de tournage",
      "Formats Reels / TikTok",
      "1 série de corrections",
    ],
  },
  {
    id: "business",
    name: "Pack Business",
    priceHT: 1190,
    priceTTC: 1428,
    perMonth: true,
    features: [
      "8 vidéos courtes / mois",
      "2 journées de tournage",
      "Stratégie éditoriale",
      "2 séries de corrections",
      "Sous-titrage inclus",
    ],
  },
  {
    id: "premium",
    name: "Pack Premium",
    priceHT: 1990,
    priceTTC: 2388,
    perMonth: true,
    features: [
      "12 vidéos + 1 vidéo longue / mois",
      "3 journées de tournage",
      "Stratégie éditoriale + reporting",
      "Corrections illimitées",
      "Sous-titrage + déclinaisons multi-formats",
    ],
  },
];

// ── VISIBILITÉ DES MONTANTS PAR RÔLE ──────────────────────────

export type FinanceRole = "client" | "partner" | "pm" | "admin";

export interface VisibleAmounts {
  /** Total HT/TTC visible (client, pm, admin). */
  showTotal: boolean;
  /** Répartition 70/20/10 visible (admin, pm selon droits) — jamais le client. */
  showSplit: boolean;
  /** Part agence (70 %) visible (agence, pm, admin). */
  showAgencyShare: boolean;
}

export function amountsVisibility(
  role: FinanceRole,
  pmHasFinanceAccess = true,
): VisibleAmounts {
  switch (role) {
    case "client":
      return { showTotal: true, showSplit: false, showAgencyShare: false };
    case "partner":
      return { showTotal: false, showSplit: false, showAgencyShare: true };
    case "pm":
      return {
        showTotal: pmHasFinanceAccess,
        showSplit: pmHasFinanceAccess,
        showAgencyShare: pmHasFinanceAccess,
      };
    case "admin":
      return { showTotal: true, showSplit: true, showAgencyShare: true };
  }
}

// ── FRP — Fonds de Réinvestissement Partenaire ────────────────

/** Libellé d'affichage du statut FRP (la règle elle-même est appliquée côté serveur). */
export function frpStatusLabel(transactionsThisYear: number): {
  label: string;
  detail: string;
  eligible: boolean;
} {
  frpOutcome(transactionsThisYear);
  return {
    label: "Décision FRP à valider",
    detail: `${transactionsThisYear}/${FRP_ANNUAL_TX_THRESHOLD} transactions cette année · aucun mouvement automatique`,
    eligible: false,
  };
}

// ── PARCOURS DE TRANSACTION EN 11 ÉTAPES ──────────────────────

export interface TransactionStep {
  key: string;
  label: string;
  description: string;
}

export const TRANSACTION_JOURNEY: TransactionStep[] = [
  {
    key: "demande",
    label: "Demande client",
    description: "Le client dépose sa demande (formulaire ou contact direct).",
  },
  {
    key: "analyse_pm",
    label: "Analyse PM",
    description:
      "Le chef de projet Silo analyse le besoin et qualifie la demande.",
  },
  {
    key: "preselection",
    label: "Présélection agences",
    description: "Le PM présélectionne les agences partenaires adaptées.",
  },
  {
    key: "dispo_agences",
    label: "Disponibilité agences",
    description:
      "Vérification des disponibilités auprès des agences présélectionnées.",
  },
  {
    key: "proposition",
    label: "Proposition au client",
    description:
      "Devis et proposition envoyés au client (montant total uniquement).",
  },
  {
    key: "choix_client",
    label: "Choix du client",
    description:
      "Le client valide la proposition (et l'agence si l'option est activée).",
  },
  {
    key: "confirmation",
    label: "Confirmation",
    description:
      "Confirmation de la commande, règlement et contractualisation.",
  },
  {
    key: "prestation",
    label: "Prestation",
    description:
      "L'agence partenaire réalise la prestation (tournage, production).",
  },
  {
    key: "supervision",
    label: "Supervision Silo",
    description: "Le PM supervise la qualité et les livraisons intermédiaires.",
  },
  {
    key: "cloture_note",
    label: "Clôture + notation",
    description: "Livraison finale validée, le client note la prestation.",
  },
  {
    key: "renouvellement",
    label: "Renouvellement",
    description: "Proposition de renouvellement ou d'abonnement au client.",
  },
];

/** Mappe le statut projet existant vers l'index (0-based) de l'étape courante du parcours 11 étapes. */
export function journeyStepForStatus(status: string): number {
  switch (status) {
    case "lead":
      return 0;
    case "qualification":
      return 1;
    case "devis":
      return 4;
    case "validation":
      return 6;
    case "production":
      return 7;
    case "livraison_agence":
      return 8;
    case "verification":
      return 8;
    case "livraison_client":
      return 8;
    case "correction":
      return 8;
    case "validation_finale":
      return 9;
    case "notation":
      return 9;
    case "archive":
      return 10;
    default:
      return 0;
  }
}
