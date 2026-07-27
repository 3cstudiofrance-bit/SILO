/**
 * Seed du feed projet (dev) — porte les anciennes entrées mockées client
 * vers la table feed_entries. Idempotent : ignoré si des entrées existent.
 * Usage : pnpm --filter @workspace/scripts run seed-feed
 */
import { db, pool, feedEntriesTable } from "@workspace/db";
import type { InsertFeedEntry } from "@workspace/db";

/** Date relative : il y a `days` jours à `h:m`. */
function D(days: number, h: number, m: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d;
}

const SEEDS: InsertFeedEntry[] = [
  // ══ proj-001 — Mariage Dupont × Moreau (production) ══
  { projectId: "proj-001", type: "evenement", authorName: "Système", authorRole: "admin", content: "Dossier créé à partir de la demande Tally #337501-112.", status: "créé", createdAt: D(21, 9, 12) },
  { projectId: "proj-001", type: "message", channel: "client_pm", authorName: "Sophie Dupont", authorRole: "client", recipient: "Chef de projet", content: "Bonjour, nous aimerions une captation drone pour la sortie d'église, est-ce possible ?", createdAt: D(20, 10, 5) },
  { projectId: "proj-001", type: "message", channel: "client_pm", authorName: "Claire Martin", authorRole: "pm", recipient: "Sophie Dupont", content: "Bonjour Sophie ! Oui, tout à fait. Je vérifie la disponibilité du télépilote et je reviens vers vous avec le complément de devis.", createdAt: D(20, 11, 30) },
  { projectId: "proj-001", type: "note_suivi", authorName: "Claire Martin", authorRole: "pm", content: "Client très réactif. Prévoir option drone dans l'avenant. Relance devis complémentaire jeudi si silence.", status: "interne", internal: true, createdAt: D(20, 11, 40) },
  { projectId: "proj-001", type: "message", channel: "pm_agency", authorName: "Claire Martin", authorRole: "pm", recipient: "Agence Alpha Prod", content: "L'équipe est confirmée pour le 26 ? Le client demande un plan drone à la sortie d'église.", createdAt: D(19, 9, 15) },
  { projectId: "proj-001", type: "message", channel: "pm_agency", authorName: "Agence Alpha Prod", authorRole: "agency", recipient: "Chef de projet", content: "Équipe confirmée. Notre télépilote est dispo, on ajoute le plan drone au conducteur.", createdAt: D(19, 10, 2) },
  { projectId: "proj-001", type: "audio", channel: "client_pm", authorName: "Sophie Dupont", authorRole: "client", recipient: "Chef de projet", content: "Message vocal — précisions sur le déroulé de la cérémonie.", durationSec: 47, createdAt: D(15, 18, 22) },
  { projectId: "proj-001", type: "appel", channel: "client_pm", authorName: "Claire Martin", authorRole: "pm", recipient: "Sophie Dupont", content: "Appel de cadrage : déroulé validé, liste des moments clés notée.", status: "effectué", durationSec: 540, createdAt: D(14, 14, 0) },
  { projectId: "proj-001", type: "fichier", authorName: "Claire Martin", authorRole: "pm", content: "Brief de tournage transmis à l'agence.", attachmentName: "brief-tournage-dupont.pdf", attachmentSize: "1,2 Mo", attachmentKind: "document", internal: true, createdAt: D(13, 9, 45) },
  { projectId: "proj-001", type: "escalade_agence_pm", authorName: "Agence Alpha Prod", authorRole: "agency", recipient: "Chef de projet", content: "Le lieu de réception refuse le vol de drone en intérieur. Besoin d'un arbitrage avec le client.", status: "resolue", createdAt: D(10, 16, 30) },
  { projectId: "proj-001", type: "note_sensible", authorName: "Claire Martin", authorRole: "pm", content: "Négociation tarifaire en cours avec l'agence sur l'option drone — ne pas communiquer au client avant l'avenant signé.", status: "sensible", internal: true, createdAt: D(10, 17, 0) },
  { projectId: "proj-001", type: "evenement", authorName: "Système", authorRole: "admin", content: "Statut du projet : passage en Production.", status: "production", createdAt: D(8, 8, 0) },
  { projectId: "proj-001", type: "fichier", authorName: "Agence Alpha Prod", authorRole: "agency", content: "Teaser 60 s déposé pour vérification qualité.", attachmentName: "teaser-dupont-v1.mp4", attachmentSize: "184 Mo", attachmentKind: "video", internal: true, createdAt: D(3, 15, 10) },
  { projectId: "proj-001", type: "validation", authorName: "Claire Martin", authorRole: "pm", content: "Teaser vérifié et transmis au client pour avis.", status: "transmis", createdAt: D(2, 10, 20) },

  // ══ proj-002 — Clip Musical Léa Rousseau (livraison agence) ══
  { projectId: "proj-002", type: "evenement", authorName: "Système", authorRole: "admin", content: "Dossier créé — demande de clip musical (Tally #337501-127).", status: "créé", createdAt: D(30, 11, 0) },
  { projectId: "proj-002", type: "message", channel: "client_pm", authorName: "Léa Rousseau", authorRole: "client", recipient: "Chef de projet", content: "Quand est-ce que je peux voir le premier montage ?", createdAt: D(6, 12, 40) },
  { projectId: "proj-002", type: "message", channel: "client_pm", authorName: "Claire Martin", authorRole: "pm", recipient: "Léa Rousseau", content: "Le montage V1 arrive cette semaine ! L'agence finalise l'étalonnage, je vous préviens dès qu'il est en ligne.", createdAt: D(6, 14, 5) },
  { projectId: "proj-002", type: "message", channel: "pm_agency", authorName: "Gamma Films", authorRole: "agency", recipient: "Chef de projet", content: "Montage envoyé en review interne. Reste l'étalonnage des scènes de nuit.", createdAt: D(5, 17, 25) },
  { projectId: "proj-002", type: "escalade_pm_admin", authorName: "Claire Martin", authorRole: "pm", recipient: "Administration", content: "Retard de 5 jours sur le planning de livraison — demande de geste commercial à valider (avoir de 5 %).", status: "en_cours", internal: true, createdAt: D(4, 9, 50) },
  { projectId: "proj-002", type: "note_suivi", authorName: "Claire Martin", authorRole: "pm", content: "Relancer Gamma Films mercredi si l'étalonnage n'est pas rendu.", status: "interne", internal: true, createdAt: D(4, 10, 0) },
  { projectId: "proj-002", type: "fichier", authorName: "Gamma Films", authorRole: "agency", content: "Montage V1 déposé.", attachmentName: "clip-lea-rousseau-v1.mp4", attachmentSize: "612 Mo", attachmentKind: "video", internal: true, createdAt: D(2, 16, 45) },
  { projectId: "proj-002", type: "appel", channel: "pm_agency", authorName: "Claire Martin", authorRole: "pm", recipient: "Gamma Films", content: "Point production : étalonnage nuit à reprendre sur 2 plans, livraison V2 vendredi.", status: "effectué", durationSec: 420, createdAt: D(1, 11, 15) },

  // ══ proj-004 — Contenu Réseaux Maison Jolie (livraison client) ══
  { projectId: "proj-004", type: "evenement", authorName: "Système", authorRole: "admin", content: "Pack réseaux sociaux Business activé — cycle mensuel n°3.", status: "abonnement", createdAt: D(12, 8, 30) },
  { projectId: "proj-004", type: "fichier", authorName: "Studio Beta Visual", authorRole: "agency", content: "Lot de 8 vidéos courtes livré pour validation client.", attachmentName: "maison-jolie-lot-mars.zip", attachmentSize: "1,4 Go", attachmentKind: "video", createdAt: D(4, 10, 10) },
  { projectId: "proj-004", type: "validation", authorName: "Carla Besson", authorRole: "client", content: "Lot validé — 7 vidéos approuvées, 1 correction demandée (sous-titres).", status: "validé", createdAt: D(2, 15, 35) },
  { projectId: "proj-004", type: "evaluation", authorName: "Carla Besson", authorRole: "client", content: "Très satisfaite du lot de ce mois-ci, le style est exactement ce qu'on voulait. Communication fluide avec Léa.", scoreValue: 5, createdAt: D(1, 9, 20) },
  { projectId: "proj-004", type: "score", authorName: "Système", authorRole: "admin", content: "Score agence mis à jour : Studio Beta Visual.", scoreValue: 4.8, createdAt: D(1, 9, 21) },
];

async function main() {
  const existing = await db.select({ id: feedEntriesTable.id }).from(feedEntriesTable).limit(1);
  if (existing.length) {
    console.log("Des entrées de feed existent déjà — seed ignoré.");
    return;
  }
  await db.insert(feedEntriesTable).values(SEEDS);
  console.log(`${SEEDS.length} entrées de feed insérées (proj-001, proj-002, proj-004).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
