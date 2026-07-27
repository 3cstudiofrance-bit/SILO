import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import {
  checkoutTransactionId,
  validatePaidCheckout,
} from "../src/lib/stripe-payments.ts";
import { getStripeCheckoutReturnUrls } from "../src/lib/stripe-webhooks.ts";

const transaction = {
  id: 42,
  projectId: 12,
  clientUserId: "user_client",
  stripeCheckoutSessionId: "cs_test_silo",
};

function checkoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_silo",
    object: "checkout.session",
    amount_total: 96_000,
    client_reference_id: "42",
    currency: "eur",
    metadata: {
      transactionId: "42",
      projectId: "12",
      clientUserId: "user_client",
    },
    mode: "payment",
    payment_intent: "pi_test_silo",
    payment_status: "paid",
    status: "complete",
    ...overrides,
  } as Stripe.Checkout.Session;
}

test("valide une session Stripe payee qui correspond au centime", () => {
  const session = checkoutSession();

  assert.equal(checkoutTransactionId(session), 42);
  assert.equal(validatePaidCheckout(session, transaction, 96_000), null);
});

test("refuse un montant Stripe different du TTC audite", () => {
  const session = checkoutSession({ amount_total: 95_999 });

  assert.equal(
    validatePaidCheckout(session, transaction, 96_000),
    "amount_mismatch",
  );
});

test("refuse une session Stripe rattachee a une autre transaction", () => {
  const session = checkoutSession({ id: "cs_test_other" });

  assert.equal(
    validatePaidCheckout(session, transaction, 96_000),
    "checkout_session_mismatch",
  );
});

test("construit les retours Checkout depuis une origine serveur controlee", () => {
  const previousBaseUrl = process.env.APP_BASE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.APP_BASE_URL = "https://app.silo.example";
  process.env.NODE_ENV = "production";

  try {
    const urls = getStripeCheckoutReturnUrls();
    assert.equal(
      urls.successUrl,
      "https://app.silo.example/dashboard/transactions?payment=success&session_id={CHECKOUT_SESSION_ID}",
    );
    assert.equal(
      urls.cancelUrl,
      "https://app.silo.example/dashboard/transactions?payment=cancelled",
    );
  } finally {
    if (previousBaseUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = previousBaseUrl;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
