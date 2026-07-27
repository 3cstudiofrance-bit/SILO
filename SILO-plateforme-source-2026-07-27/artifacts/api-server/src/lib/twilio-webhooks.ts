import type { Request } from "express";
import twilio from "twilio";

type TwilioValidationResult =
  | { ok: true }
  | { ok: false; status: 403 | 415 | 503; error: string };

function webhookUrl(req: Request): string | null {
  const configuredBase = process.env.TWILIO_WEBHOOK_BASE_URL?.trim();
  if (configuredBase) {
    try {
      const origin = new URL(configuredBase).origin;
      return new URL(req.originalUrl, origin).toString();
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
}

export function validateTwilioFormWebhook(
  req: Request,
): TwilioValidationResult {
  if (!req.is("application/x-www-form-urlencoded")) {
    return {
      ok: false,
      status: 415,
      error: "Type de contenu Twilio non pris en charge",
    };
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const signature = req.get("x-twilio-signature")?.trim();
  const url = webhookUrl(req);

  if (!authToken || !url) {
    return {
      ok: false,
      status: 503,
      error: "Validation Twilio non configuree",
    };
  }

  if (!signature) {
    return { ok: false, status: 403, error: "Signature Twilio absente" };
  }

  const valid = twilio.validateRequest(
    authToken,
    signature,
    url,
    req.body as Record<string, string>,
  );

  return valid
    ? { ok: true }
    : { ok: false, status: 403, error: "Signature Twilio invalide" };
}
