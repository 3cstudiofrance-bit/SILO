export const BASIS_POINTS = 10_000;

export const TVA_RATE = 0.2;
export const TVA_RATE_BPS = 2_000;

export const QUOTE_FLOOR_PONCTUEL_HT = 800;
export const QUOTE_FLOOR_ABONNEMENT_HT = 600;
export const FRP_ANNUAL_TX_THRESHOLD = 24;
export const FINANCIAL_CALCULATION_VERSION = "bp-2026-07-25-v1";
export const ADVISOR_MAX_ACTIVE_PROJECTS = 80;
export const ADVISOR_WARNING_ACTIVE_PROJECTS = 72;
export const ADVISOR_PARTNER_PORTFOLIO_TARGET = 50;

export interface AdvisorCapacityState {
  activeProjects: number;
  warning: boolean;
  full: boolean;
  limit: number;
  warningThreshold: number;
}

export function advisorCapacityState(
  activeProjects: number,
): AdvisorCapacityState {
  if (!Number.isSafeInteger(activeProjects) || activeProjects < 0) {
    throw new RangeError(
      "Le nombre de projets actifs doit etre un entier positif ou nul.",
    );
  }

  return {
    activeProjects,
    warning: activeProjects >= ADVISOR_WARNING_ACTIVE_PROJECTS,
    full: activeProjects >= ADVISOR_MAX_ACTIVE_PROJECTS,
    limit: ADVISOR_MAX_ACTIVE_PROJECTS,
    warningThreshold: ADVISOR_WARNING_ACTIVE_PROJECTS,
  };
}

export const SPLIT = {
  agence: 0.7,
  silo: 0.2,
  frp: 0.1,
} as const;

export const OPERATIONAL_RATES_BPS = {
  agence: 7_000,
  silo: 2_000,
  frp: 1_000,
  psp: 200,
  incidentReserve: 50,
  advisorVariable: 160,
} as const;

export type TransactionKind = "ponctuel" | "abonnement";

export interface FinancialSplit {
  ht: number;
  tva: number;
  ttc: number;
  partAgence: number;
  partSilo: number;
  partFrp: number;
}

export interface OperationalAllocation extends FinancialSplit {
  fraisPspTotal: number;
  fraisPspAgence: number;
  fraisPspSilo: number;
  partAgenceApresPsp: number;
  partSiloApresPsp: number;
  reserveIncidents: number;
  primeConseiller: number;
  contributionSiloApresVariables: number;
}

function assertEuroAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("Le montant doit etre un nombre positif ou nul.");
  }
}

export function eurosToCents(amount: number): number {
  assertEuroAmount(amount);
  return Math.round((amount + Number.EPSILON) * 100);
}

export function centsToEuros(cents: number): number {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError("Le montant en centimes doit etre un entier sur.");
  }
  return cents / 100;
}

function applyBasisPoints(cents: number, basisPoints: number): number {
  return Math.round((cents * basisPoints) / BASIS_POINTS);
}

export function computeSplit(montantHT: number): FinancialSplit {
  const htCents = eurosToCents(montantHT);
  const partAgenceCents = applyBasisPoints(
    htCents,
    OPERATIONAL_RATES_BPS.agence,
  );
  const partFrpCents = applyBasisPoints(htCents, OPERATIONAL_RATES_BPS.frp);
  const partSiloCents = htCents - partAgenceCents - partFrpCents;
  const tvaCents = applyBasisPoints(htCents, TVA_RATE_BPS);

  return {
    ht: centsToEuros(htCents),
    tva: centsToEuros(tvaCents),
    ttc: centsToEuros(htCents + tvaCents),
    partAgence: centsToEuros(partAgenceCents),
    partSilo: centsToEuros(partSiloCents),
    partFrp: centsToEuros(partFrpCents),
  };
}

export function computeOperationalAllocation(
  montantHT: number,
  options: { advisorCommissionEligible?: boolean } = {},
): OperationalAllocation {
  const split = computeSplit(montantHT);
  const htCents = eurosToCents(split.ht);
  const partAgenceCents = eurosToCents(split.partAgence);
  const partSiloCents = eurosToCents(split.partSilo);

  const fraisPspTotalCents = applyBasisPoints(
    htCents,
    OPERATIONAL_RATES_BPS.psp,
  );
  // Les frais hors FRP sont repartis au prorata 70/20, soit 7/9 et 2/9.
  const fraisPspAgenceCents = Math.round((fraisPspTotalCents * 7) / 9);
  const fraisPspSiloCents = fraisPspTotalCents - fraisPspAgenceCents;
  const reserveIncidentsCents = applyBasisPoints(
    htCents,
    OPERATIONAL_RATES_BPS.incidentReserve,
  );
  const primeConseillerCents = options.advisorCommissionEligible
    ? applyBasisPoints(htCents, OPERATIONAL_RATES_BPS.advisorVariable)
    : 0;

  return {
    ...split,
    fraisPspTotal: centsToEuros(fraisPspTotalCents),
    fraisPspAgence: centsToEuros(fraisPspAgenceCents),
    fraisPspSilo: centsToEuros(fraisPspSiloCents),
    partAgenceApresPsp: centsToEuros(
      partAgenceCents - fraisPspAgenceCents,
    ),
    partSiloApresPsp: centsToEuros(partSiloCents - fraisPspSiloCents),
    reserveIncidents: centsToEuros(reserveIncidentsCents),
    primeConseiller: centsToEuros(primeConseillerCents),
    contributionSiloApresVariables: centsToEuros(
      partSiloCents -
        fraisPspSiloCents -
        reserveIncidentsCents -
        primeConseillerCents,
    ),
  };
}

export function quoteFloorFor(kind: TransactionKind): number {
  return kind === "ponctuel"
    ? QUOTE_FLOOR_PONCTUEL_HT
    : QUOTE_FLOOR_ABONNEMENT_HT;
}

export function meetsQuoteFloor(
  montantHT: number,
  kind: TransactionKind,
): boolean {
  return montantHT >= quoteFloorFor(kind);
}

export function frpOutcome(
  transactionsThisYear: number,
): "decision_manuelle_requise" {
  if (!Number.isSafeInteger(transactionsThisYear) || transactionsThisYear < 0) {
    throw new RangeError(
      "Le nombre de transactions doit etre un entier positif ou nul.",
    );
  }

  // Le business plan et le cahier des charges se contredisent sur la date et
  // le seuil. Aucun reversement ou reinvestissement ne doit donc etre
  // automatise avant validation juridique, comptable et direction.
  return "decision_manuelle_requise";
}
