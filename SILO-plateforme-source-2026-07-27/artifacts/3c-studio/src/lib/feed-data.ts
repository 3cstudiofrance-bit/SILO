/**
 * feed-data — métadonnées d'affichage du feed projet.
 *
 * Les entrées vivent désormais côté serveur (API /feed/{projectId}) :
 * la matrice de visibilité par rôle est appliquée dans l'API, jamais ici.
 * Ce module ne conserve que les types et libellés de présentation.
 */
import type { FeedEntry as ApiFeedEntry } from "@workspace/api-client-react";

export type FeedRole = "client" | "pm" | "agency" | "admin";

export type MessageChannel = "client_pm" | "pm_agency" | "client_agency";

export type FeedEntryType =
  | "message" // message texte (canal client↔PM, PM↔agence, client↔agence)
  | "audio" // message vocal (client)
  | "fichier" // dépôt de fichier
  | "evenement" // événement système (statut, jalon…)
  | "note_suivi" // note interne opérationnelle (PM / admin)
  | "note_sensible" // note sensible : admin + PM concerné uniquement
  | "escalade_agence_pm" // escalade agence → PM
  | "escalade_pm_admin" // escalade PM → admin
  | "evaluation" // évaluation finale du client
  | "score" // score attribué (agence / PM)
  | "appel" // appel téléphonique journalisé
  | "validation"; // validation d'un livrable

/** Entrée affichée dans le feed — id string pour fusionner API + temps réel. */
export interface FeedEntry extends Omit<ApiFeedEntry, "id"> {
  id: string;
}

// ── MÉTADONNÉES D'AFFICHAGE ────────────────────────────────────

export const ENTRY_TYPE_LABELS: Record<FeedEntryType, string> = {
  message: "Message",
  audio: "Message vocal",
  fichier: "Fichier",
  evenement: "Événement",
  note_suivi: "Note de suivi",
  note_sensible: "Note sensible",
  escalade_agence_pm: "Escalade agence → PM",
  escalade_pm_admin: "Escalade PM → Admin",
  evaluation: "Évaluation client",
  score: "Score",
  appel: "Appel",
  validation: "Validation",
};

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  client_pm: "Client ↔ Chef de projet",
  pm_agency: "Chef de projet ↔ Agence",
  client_agency: "Client ↔ Agence (supervisée)",
};

/** L'agence ne voit de l'évaluation qu'un résumé/score (redaction côté serveur). */
export function seesEvaluationSummaryOnly(role: FeedRole): boolean {
  return role === "agency";
}
