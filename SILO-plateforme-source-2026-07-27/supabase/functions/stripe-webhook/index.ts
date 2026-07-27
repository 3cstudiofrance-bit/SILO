/**
 * Supabase Edge Function — stripe-webhook
 * Reçoit et traite les webhooks Stripe.
 *
 * Déploiement : supabase functions deploy stripe-webhook
 * Configurer dans Stripe Dashboard : https://dashboard.stripe.com/webhooks
 */

import Stripe from "npm:stripe@^22";

const stripeApiKey = Deno.env.get("STRIPE_RESTRICTED_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!stripe || !webhookSecret) {
    return new Response("Webhook Stripe non configure", { status: 503 });
  }
  if (!signature) {
    return new Response("Signature Stripe absente", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        console.log("[stripe-webhook] Paiement réussi:", pi.id);
        // Mettre à jour la facture dans Supabase
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        console.log("[stripe-webhook] Paiement échoué:", pi.id);
        break;
      }
      case "invoice.paid": {
        console.log("[stripe-webhook] Facture payée");
        break;
      }
      default:
        console.log("[stripe-webhook] Evenement non gere:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook invalide";
    console.error("[stripe-webhook] Erreur de verification:", message);
    return new Response(message, { status: 400 });
  }
});
