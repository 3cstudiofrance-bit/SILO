import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, activityTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router = Router();

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }

  const { name, email, phone, serviceType, budget, message } = parsed.data;

  const [contact] = await db.insert(contactsTable).values({
    name,
    email,
    phone: phone ?? null,
    serviceType,
    budget: budget ?? null,
    message,
  }).returning();

  await db.insert(activityTable).values({
    type: "contact_received",
    title: "Nouveau contact",
    description: `${name} — ${serviceType}`,
    projectId: null,
  });

  res.status(201).json({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    serviceType: contact.serviceType,
    budget: contact.budget,
    message: contact.message,
    createdAt: contact.createdAt.toISOString(),
  });
});

export default router;
