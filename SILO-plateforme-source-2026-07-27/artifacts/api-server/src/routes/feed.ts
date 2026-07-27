import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { and, asc, eq, ne } from "drizzle-orm";
import {
  db,
  feedEntriesTable,
  partnerMissionsTable,
  type FeedEntryRow,
} from "@workspace/db";
import { CreateFeedEntryBody } from "@workspace/api-zod";
import { getRoleAsync, getUserId, getUserNameAsync, type Role } from "../lib/roles";
import { isDirectEnabled } from "../lib/comm";
import { authorizeProject } from "../lib/project-access";

const router: IRouter = Router();

type FeedRole = "client" | "pm" | "agency" | "admin";

/** Rôle Clerk → rôle feed (partner = agence). */
function feedRole(role: Role): FeedRole {
  return role === "partner" ? "agency" : role;
}

/**
 * Matrice de visibilité du CDC — appliquée côté serveur, jamais côté client.
 * - Admin / PM : tout.
 * - Client : ses canaux (client↔PM, client↔agence), fichiers/événements non
 *   internes, validations, sa propre évaluation. Jamais notes, escalades,
 *   scores ni le canal PM↔agence.
 * - Agence : canaux PM↔agence et client↔agence, production (fichiers,
 *   événements, validations), ses escalades vers le PM, évaluation (résumé
 *   seulement) et score. Jamais les notes internes Silo ni escalades PM→admin.
 */
function isVisibleTo(
  entry: FeedEntryRow,
  role: FeedRole,
  userId: string,
): boolean {
  if (role === "admin" || role === "pm") return true;

  if (role === "client") {
    switch (entry.type) {
      case "message":
      case "audio":
      case "appel":
        return entry.channel === "client_pm" || entry.channel === "client_agency";
      case "fichier":
      case "evenement":
        return !entry.internal;
      case "validation":
        return true;
      case "evaluation":
        return entry.authorRole === "client";
      default:
        return false;
    }
  }

  // agence
  if (
    (entry.channel === "pm_agency" ||
      entry.channel === "client_agency") &&
    entry.counterpartyUserId !== userId
  ) {
    return false;
  }
  switch (entry.type) {
    case "message":
    case "audio":
    case "appel":
      return entry.channel === "pm_agency" || entry.channel === "client_agency";
    case "fichier":
    case "evenement":
    case "validation":
      return true;
    case "escalade_agence_pm":
      return true;
    case "evaluation":
    case "score":
      return true;
    default:
      return false;
  }
}

function serialize(entry: FeedEntryRow, role: FeedRole) {
  // L'agence ne voit de l'évaluation client qu'un résumé — le texte intégral
  // ne quitte jamais le serveur pour ce rôle.
  const summaryOnly = role === "agency" && entry.type === "evaluation";
  return {
    id: entry.id,
    projectId: entry.projectId,
    type: entry.type,
    channel: entry.channel,
    authorName: entry.authorName,
    authorRole: entry.authorRole,
    authorUserId: entry.authorUserId,
    counterpartyUserId: entry.counterpartyUserId,
    recipient: entry.recipient,
    content: summaryOnly ? "Évaluation client reçue — résumé : retour positif." : entry.content,
    status: entry.status,
    attachmentName: entry.attachmentName,
    attachmentSize: entry.attachmentSize,
    attachmentKind: entry.attachmentKind,
    durationSec: entry.durationSec,
    scoreValue: entry.scoreValue,
    internal: entry.internal,
    createdAt: entry.createdAt.toISOString(),
  };
}

router.get("/feed/:projectId", requireAuth(), async (req, res) => {
  const numericProjectId = Number(req.params.projectId);
  if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
    res.status(400).json({ error: "ID projet invalide" });
    return;
  }
  const access = await authorizeProject(req, res, numericProjectId);
  if (!access) return;

  const role = feedRole(await getRoleAsync(req));
  const projectId = String(numericProjectId);
  const rows = await db
    .select()
    .from(feedEntriesTable)
    .where(eq(feedEntriesTable.projectId, projectId))
    .orderBy(asc(feedEntriesTable.createdAt), asc(feedEntriesTable.id));
  res.json(
    rows
      .filter((entry) => isVisibleTo(entry, role, access.userId))
      .map((entry) => serialize(entry, role)),
  );
});

const DEFAULT_NAMES: Record<FeedRole, string> = {
  client: "Client",
  pm: "Chef de projet Silo",
  agency: "Agence partenaire",
  admin: "Administration",
};

router.post("/feed/:projectId", requireAuth(), async (req, res) => {
  const numericProjectId = Number(req.params.projectId);
  if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
    res.status(400).json({ error: "ID projet invalide" });
    return;
  }
  const access = await authorizeProject(req, res, numericProjectId);
  if (!access) return;

  const role = feedRole(await getRoleAsync(req));
  const projectId = String(numericProjectId);

  const parsed = CreateFeedEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  const { mode, channel, content, sensible, partnerUserId } = parsed.data;

  // Modes autorisés par rôle (composer du CDC)
  const allowedModes: Record<FeedRole, string[]> = {
    client: ["message"],
    pm: ["message", "note", "escalade"],
    agency: ["message", "escalade"],
    admin: ["note"],
  };
  if (!allowedModes[role].includes(mode)) {
    res.status(403).json({ error: "Accès refusé — ce type d'entrée n'est pas autorisé pour votre rôle" });
    return;
  }

  const authorName = (await getUserNameAsync(req)) ?? DEFAULT_NAMES[role];
  const authorUserId = getUserId(req);

  let values: typeof feedEntriesTable.$inferInsert;

  if (mode === "message") {
    // Canaux autorisés par rôle ; client↔agence exige la comm directe active.
    const allowedChannels: Record<FeedRole, string[]> = {
      client: ["client_pm", "client_agency"],
      pm: ["client_pm", "pm_agency"],
      agency: ["pm_agency", "client_agency"],
      admin: [],
    };
    if (!channel || !allowedChannels[role].includes(channel)) {
      res.status(403).json({ error: "Accès refusé — canal non autorisé pour votre rôle" });
      return;
    }
    if (channel === "client_agency" && !(await isDirectEnabled(projectId))) {
      res.status(403).json({ error: "La communication directe Client↔Agence n'est pas activée sur ce projet" });
      return;
    }

    let counterpartyUserId: string | null = null;
    if (channel === "pm_agency" || channel === "client_agency") {
      const projectPartners = await db
        .select({ userId: partnerMissionsTable.partnerId })
        .from(partnerMissionsTable)
        .where(
          and(
            eq(partnerMissionsTable.projectId, numericProjectId),
            ne(partnerMissionsTable.status, "refuse"),
          ),
        );
      const partnerIds = [
        ...new Set(projectPartners.map((partner) => partner.userId)),
      ];

      if (role === "agency") {
        if (!partnerIds.includes(access.userId)) {
          res.status(403).json({ error: "Agence non attribuée à ce projet" });
          return;
        }
        counterpartyUserId = access.userId;
      } else if (partnerUserId && partnerIds.includes(partnerUserId)) {
        counterpartyUserId = partnerUserId;
      } else if (!partnerUserId && partnerIds.length === 1) {
        counterpartyUserId = partnerIds[0];
      } else {
        res.status(400).json({
          error:
            partnerIds.length === 0
              ? "Aucune agence attribuée à ce projet"
              : "Sélectionnez l'agence destinataire",
        });
        return;
      }
    }

    const recipient =
      channel === "client_pm"
        ? role === "client"
          ? "Chef de projet"
          : "Client"
        : channel === "pm_agency"
          ? role === "agency"
            ? "Chef de projet"
            : "Agence"
          : role === "client"
            ? "Agence (supervisée)"
            : "Client (supervisée)";
    values = {
      projectId,
      type: "message",
      channel,
      authorName,
      authorRole: role,
      authorUserId,
      counterpartyUserId,
      recipient,
      content,
    };
  } else if (mode === "note") {
    values = {
      projectId,
      type: sensible ? "note_sensible" : "note_suivi",
      authorName,
      authorRole: role,
      authorUserId,
      content,
      status: sensible ? "sensible" : "interne",
      internal: true,
    };
  } else {
    // escalade : agence → PM, PM → admin
    values = {
      projectId,
      type: role === "agency" ? "escalade_agence_pm" : "escalade_pm_admin",
      authorName,
      authorRole: role,
      authorUserId,
      recipient: role === "agency" ? "Chef de projet" : "Administration",
      content,
      status: "ouverte",
      internal: true,
    };
  }

  const [entry] = await db.insert(feedEntriesTable).values(values).returning();
  res.status(201).json(serialize(entry, role));
});

export default router;
