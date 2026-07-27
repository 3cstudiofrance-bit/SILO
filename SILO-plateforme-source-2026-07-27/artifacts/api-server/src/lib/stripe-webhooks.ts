import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const apiKey =
    process.env.STRIPE_RESTRICTED_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim();

  if (!apiKey) {
    throw new Error("Cle API Stripe serveur non configuree");
  }

  stripeClient ??= new Stripe(apiKey, {
    apiVersion: "2026-06-24.dahlia",
  });
  return stripeClient;
}

export function constructStripeWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signingSecret) {
    throw new Error("Secret de signature Stripe non configure");
  }

  return getStripeClient().webhooks.constructEvent(
    payload,
    signature,
    signingSecret,
  );
}

export function getStripeCheckoutReturnUrls(): {
  successUrl: string;
  cancelUrl: string;
} {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  if (!configuredBaseUrl) {
    throw new Error("APP_BASE_URL non configuree");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredBaseUrl);
  } catch {
    throw new Error("APP_BASE_URL invalide");
  }

  const isLocal =
    baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1";
  if (
    baseUrl.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && isLocal)
  ) {
    throw new Error("APP_BASE_URL doit utiliser HTTPS");
  }

  const successUrl = new URL("/dashboard/transactions", baseUrl);
  successUrl.searchParams.set("payment", "success");
  const cancelUrl = new URL("/dashboard/transactions", baseUrl);
  cancelUrl.searchParams.set("payment", "cancelled");

  return {
    successUrl: `${successUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: cancelUrl.toString(),
  };
}
