export type ClientProfile = "entreprise" | "artiste" | "particulier";
export type DossierUrgency = "haute" | "normale" | "basse";
export type DossierSource = "tally" | "svi" | "site" | "recommandation";

export type DossierStatus =
  | "nouveau"
  | "en_traitement"
  | "a_relancer"
  | "en_attente"
  | "suivi"
  | "cloture"
  | "archive";

export type WaitReason =
  | "escalade"
  | "rdv_telephonique"
  | "suivi"
  | "retour_client_48h"
  | "retour_agence_48h"
  | "validation_admin"
  | "fichier_client"
  | "correction_agence";

export const WAIT_REASON_CONFIG: Record<
  WaitReason,
  { label: string; trigger: string; delayHours: number }
> = {
  escalade: {
    label: "Escalade admin",
    trigger: "Réponse de l’administrateur",
    delayHours: 24,
  },
  rdv_telephonique: {
    label: "RDV téléphonique",
    trigger: "Heure du rendez-vous",
    delayHours: 24,
  },
  suivi: {
    label: "Suivi",
    trigger: "Nouveau message client",
    delayHours: 72,
  },
  retour_client_48h: {
    label: "Retour client (48 h)",
    trigger: "Réponse du client",
    delayHours: 48,
  },
  retour_agence_48h: {
    label: "Retour agence (48 h)",
    trigger: "Réponse de l’agence",
    delayHours: 48,
  },
  validation_admin: {
    label: "Validation admin",
    trigger: "Validation de l’administrateur",
    delayHours: 24,
  },
  fichier_client: {
    label: "Fichier client attendu",
    trigger: "Réception du fichier",
    delayHours: 48,
  },
  correction_agence: {
    label: "Correction agence",
    trigger: "Livraison corrigée",
    delayHours: 48,
  },
};

export interface DossierEvent {
  id: string;
  date: string;
  author: string;
  authorRole: "pm" | "client" | "admin" | "system" | "agence";
  title: string;
  description?: string;
  type:
    | "created"
    | "reserved"
    | "call"
    | "message"
    | "wait"
    | "resume"
    | "status"
    | "escalade"
    | "closed"
    | "system";
}

export interface Dossier {
  id: string;
  service: string;
  clientProfile: ClientProfile;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  need: string;
  urgency: DossierUrgency;
  attachment?: string;
  source: DossierSource;
  status: DossierStatus;
  createdAt: string;
  assignedPm?: string;
  reservedAt?: string;
  lastTreatedAt?: string;
  followUpUntil?: string;
  waitReason?: WaitReason;
  waitUntil?: string;
  closedAt?: string;
  unreadClientMessage?: boolean;
  events: DossierEvent[];
}

export const PROFILE_LABELS: Record<ClientProfile, string> = {
  entreprise: "Entreprise",
  artiste: "Artiste",
  particulier: "Particulier",
};

export const SOURCE_LABELS: Record<DossierSource, string> = {
  tally: "Formulaire Tally",
  svi: "Appel SVI",
  site: "Espace client",
  recommandation: "Recommandation",
};

export const URGENCY_CONFIG: Record<
  DossierUrgency,
  { label: string; color: string; bg: string }
> = {
  haute: {
    label: "Urgent",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
  },
  normale: {
    label: "Normale",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
  },
  basse: {
    label: "Basse",
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/30",
  },
};

export type Rubrique =
  | "a_reserver"
  | "mes_dossiers"
  | "a_relancer"
  | "en_attente"
  | "urgents"
  | "en_retard"
  | "clotures"
  | "archives";

export const RUBRIQUES: { key: Rubrique; label: string }[] = [
  { key: "a_reserver", label: "À réserver" },
  { key: "mes_dossiers", label: "Mes dossiers" },
  { key: "a_relancer", label: "Mes dossiers à relancer" },
  { key: "en_attente", label: "En attente" },
  { key: "urgents", label: "Urgents" },
  { key: "en_retard", label: "En retard" },
  { key: "clotures", label: "Clôturés" },
  { key: "archives", label: "Archivés" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function isLate(dossier: Dossier, at = Date.now()): boolean {
  if (dossier.status === "cloture" || dossier.status === "archive") {
    return false;
  }
  if (dossier.waitUntil && new Date(dossier.waitUntil).getTime() < at) {
    return true;
  }
  return (
    dossier.status === "nouveau" &&
    at - new Date(dossier.createdAt).getTime() > DAY_MS
  );
}

export function needsRelance(dossier: Dossier, at = Date.now()): boolean {
  if (dossier.status === "a_relancer") return true;
  return (
    dossier.status === "en_traitement" &&
    Boolean(dossier.lastTreatedAt) &&
    at - new Date(dossier.lastTreatedAt as string).getTime() > DAY_MS
  );
}

export function isInFollowUp(
  dossier: Dossier,
  at = Date.now(),
): boolean {
  return (
    dossier.status === "suivi" &&
    Boolean(dossier.followUpUntil) &&
    new Date(dossier.followUpUntil as string).getTime() > at &&
    !dossier.unreadClientMessage
  );
}

export function sortDossiers(list: Dossier[]): Dossier[] {
  const urgencyRank: Record<DossierUrgency, number> = {
    haute: 0,
    normale: 1,
    basse: 2,
  };
  return [...list].sort((left, right) => {
    const leftTreated = left.lastTreatedAt ? 1 : 0;
    const rightTreated = right.lastTreatedAt ? 1 : 0;
    if (leftTreated !== rightTreated) return leftTreated - rightTreated;
    if (urgencyRank[left.urgency] !== urgencyRank[right.urgency]) {
      return urgencyRank[left.urgency] - urgencyRank[right.urgency];
    }
    return (
      new Date(right.createdAt).getTime() -
      new Date(left.createdAt).getTime()
    );
  });
}

export function rubriqueOf(
  list: Dossier[],
  rubrique: Rubrique,
  advisorName: string,
  at = Date.now(),
): Dossier[] {
  switch (rubrique) {
    case "a_reserver":
      return sortDossiers(
        list.filter((dossier) => dossier.status === "nouveau"),
      );
    case "mes_dossiers":
      return sortDossiers(
        list.filter(
          (dossier) =>
            dossier.assignedPm === advisorName &&
            ["en_traitement", "a_relancer", "suivi"].includes(
              dossier.status,
            ),
        ),
      );
    case "a_relancer":
      return sortDossiers(
        list.filter(
          (dossier) =>
            dossier.assignedPm === advisorName &&
            needsRelance(dossier, at),
        ),
      );
    case "en_attente":
      return sortDossiers(
        list.filter(
          (dossier) =>
            dossier.assignedPm === advisorName &&
            dossier.status === "en_attente",
        ),
      );
    case "urgents":
      return sortDossiers(
        list.filter(
          (dossier) =>
            dossier.urgency === "haute" &&
            !["cloture", "archive"].includes(dossier.status),
        ),
      );
    case "en_retard":
      return sortDossiers(list.filter((dossier) => isLate(dossier, at)));
    case "clotures":
      return list
        .filter((dossier) => dossier.status === "cloture")
        .sort((left, right) =>
          (right.closedAt || "").localeCompare(left.closedAt || ""),
        );
    case "archives":
      return list.filter((dossier) => dossier.status === "archive");
  }
}

export function formatRelative(iso: string): string {
  const difference = Date.now() - new Date(iso).getTime();
  const absolute = Math.abs(difference);
  const hours = Math.round(absolute / 3_600_000);
  const label =
    absolute < 3_600_000
      ? `${Math.max(1, Math.round(absolute / 60_000))} min`
      : hours < 48
        ? `${hours} h`
        : `${Math.round(hours / 24)} j`;
  return difference >= 0 ? `il y a ${label}` : `dans ${label}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
