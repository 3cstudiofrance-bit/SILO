import { Router, type IRouter } from "express";
import { db, webhookEventsTable } from "@workspace/db";
import { z } from "zod/v4";
import { validateTwilioFormWebhook } from "../lib/twilio-webhooks";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const twilioSid = z
  .string()
  .regex(/^[A-Z]{2}[a-fA-F0-9]{32}$/);

const messagingStatus = z.enum([
  "accepted",
  "scheduled",
  "canceled",
  "queued",
  "sending",
  "sent",
  "delivered",
  "undelivered",
  "failed",
  "read",
]);

const voiceStatus = z.enum([
  "queued",
  "initiated",
  "ringing",
  "in-progress",
  "answered",
  "completed",
  "busy",
  "failed",
  "no-answer",
  "canceled",
]);

const messagingPayload = z.object({
  MessageSid: twilioSid,
  MessageStatus: messagingStatus,
  ErrorCode: z.string().max(16).optional(),
});

const voicePayload = z.object({
  CallSid: twilioSid,
  CallStatus: voiceStatus,
  ErrorCode: z.string().max(16).optional(),
});

function idempotencyKey(
  headerValue: string | undefined,
  externalId: string,
  status: string,
  errorCode?: string,
): string {
  return headerValue?.trim() || `${externalId}:${status}:${errorCode ?? ""}`;
}

router.post("/webhooks/twilio/messaging-status", async (req, res) => {
  const validation = validateTwilioFormWebhook(req);
  if (!validation.ok) {
    res.status(validation.status).json({ error: validation.error });
    return;
  }

  const parsed = messagingPayload.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Callback de messagerie invalide" });
    return;
  }

  const payload = parsed.data;
  await db
    .insert(webhookEventsTable)
    .values({
      provider: "twilio",
      idempotencyKey: idempotencyKey(
        req.get("i-twilio-idempotency-token"),
        payload.MessageSid,
        payload.MessageStatus,
        payload.ErrorCode,
      ),
      externalId: payload.MessageSid,
      eventType: `messaging.status.${payload.MessageStatus}`,
      status: payload.MessageStatus,
      errorCode: payload.ErrorCode ?? null,
    })
    .onConflictDoNothing();

  if (payload.ErrorCode) {
    logger.warn(
      {
        messageSid: payload.MessageSid,
        status: payload.MessageStatus,
        errorCode: payload.ErrorCode,
      },
      "Twilio messaging delivery issue",
    );
  }

  res.sendStatus(204);
});

router.post("/webhooks/twilio/voice-status", async (req, res) => {
  const validation = validateTwilioFormWebhook(req);
  if (!validation.ok) {
    res.status(validation.status).json({ error: validation.error });
    return;
  }

  const parsed = voicePayload.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Callback vocal invalide" });
    return;
  }

  const payload = parsed.data;
  await db
    .insert(webhookEventsTable)
    .values({
      provider: "twilio",
      idempotencyKey: idempotencyKey(
        req.get("i-twilio-idempotency-token"),
        payload.CallSid,
        payload.CallStatus,
        payload.ErrorCode,
      ),
      externalId: payload.CallSid,
      eventType: `voice.status.${payload.CallStatus}`,
      status: payload.CallStatus,
      errorCode: payload.ErrorCode ?? null,
    })
    .onConflictDoNothing();

  if (payload.ErrorCode) {
    logger.warn(
      {
        callSid: payload.CallSid,
        status: payload.CallStatus,
        errorCode: payload.ErrorCode,
      },
      "Twilio voice delivery issue",
    );
  }

  res.sendStatus(204);
});

export default router;
