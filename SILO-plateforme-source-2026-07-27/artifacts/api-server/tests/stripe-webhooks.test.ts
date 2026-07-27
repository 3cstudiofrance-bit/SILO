import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { constructStripeWebhookEvent } from "../src/lib/stripe-webhooks.ts";

const payload = JSON.stringify({
  id: "evt_000000000000000000000000",
  object: "event",
  api_version: "2026-06-24.dahlia",
  created: 1_774_000_000,
  data: {
    object: {
      id: "pi_000000000000000000000000",
      object: "payment_intent",
      status: "succeeded",
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: null,
  type: "payment_intent.succeeded",
});

test("verifie le corps brut et la signature Stripe", () => {
  const signingSecret = "whsec_test_signing_secret";
  process.env.STRIPE_RESTRICTED_KEY = "rk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = signingSecret;

  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: signingSecret,
  });
  const event = constructStripeWebhookEvent(Buffer.from(payload), signature);

  assert.equal(event.id, "evt_000000000000000000000000");
  assert.equal(event.type, "payment_intent.succeeded");
});

test("refuse une signature Stripe invalide", () => {
  process.env.STRIPE_RESTRICTED_KEY = "rk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_signing_secret";

  assert.throws(
    () =>
      constructStripeWebhookEvent(Buffer.from(payload), "t=0,v1=invalid"),
    /signature/i,
  );
});
