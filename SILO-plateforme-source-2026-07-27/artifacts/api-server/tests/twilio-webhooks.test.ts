import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";
import twilio from "twilio";
import { validateTwilioFormWebhook } from "../src/lib/twilio-webhooks.ts";

const authToken = "test-auth-token";
const webhookUrl =
  "https://api.silo.example/api/webhooks/twilio/messaging-status";
const body = {
  MessageSid: "SM00000000000000000000000000000000",
  MessageStatus: "delivered",
};

function request(signature?: string): Request {
  return {
    body,
    originalUrl: "/api/webhooks/twilio/messaging-status",
    protocol: "https",
    is: (type: string) =>
      type === "application/x-www-form-urlencoded" ? type : false,
    get: (name: string) => {
      const normalized = name.toLowerCase();
      if (normalized === "x-twilio-signature") return signature;
      if (normalized === "host") return "internal.invalid";
      return undefined;
    },
  } as unknown as Request;
}

test("accepte une signature Twilio calculee sur l'URL publique configuree", () => {
  process.env.NODE_ENV = "production";
  process.env.TWILIO_AUTH_TOKEN = authToken;
  process.env.TWILIO_WEBHOOK_BASE_URL = "https://api.silo.example";

  const signature = twilio.getExpectedTwilioSignature(
    authToken,
    webhookUrl,
    body,
  );

  assert.deepEqual(validateTwilioFormWebhook(request(signature)), {
    ok: true,
  });
});

test("refuse une signature Twilio invalide", () => {
  process.env.NODE_ENV = "production";
  process.env.TWILIO_AUTH_TOKEN = authToken;
  process.env.TWILIO_WEBHOOK_BASE_URL = "https://api.silo.example";

  assert.deepEqual(validateTwilioFormWebhook(request("invalid")), {
    ok: false,
    status: 403,
    error: "Signature Twilio invalide",
  });
});
