import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import {
  db,
  frpMovementsTable,
  transactionsTable,
  webhookEventsTable,
} from "@workspace/db";
import { constructStripeWebhookEvent } from "../lib/stripe-webhooks";
import { logger } from "../lib/logger";
import {
  checkoutIdentityError,
  checkoutTransactionId,
  stripePaymentIntentId,
  validatePaidCheckout,
} from "../lib/stripe-payments";
import { eurosToCents } from "../lib/finance";

const router: IRouter = Router();
const CHECKOUT_EVENTS = new Set<string>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

router.post("/", async (req, res) => {
  const signature = req.get("stripe-signature");
  if (!signature || !Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: "Signature ou corps Stripe absent" });
    return;
  }

  let event;
  try {
    event = constructStripeWebhookEvent(req.body, signature);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook Stripe invalide";
    const configurationError = message.includes("non configure");
    logger.warn({ error: message }, "Stripe webhook rejected");
    res.status(configurationError ? 503 : 400).json({ error: message });
    return;
  }

  const object = event.data.object as {
    id?: unknown;
    object?: unknown;
    status?: unknown;
  };
  const externalId =
    typeof object.id === "string"
      ? object.id
      : typeof object.object === "string"
        ? object.object
        : event.id;
  const status = typeof object.status === "string" ? object.status : null;

  try {
    const processingResult = await db.transaction(async (database) => {
      const [journal] = await database
        .insert(webhookEventsTable)
        .values({
          provider: "stripe",
          idempotencyKey: event.id,
          externalId,
          eventType: event.type,
          status,
        })
        .onConflictDoNothing()
        .returning({ id: webhookEventsTable.id });

      if (!journal) return { duplicate: true, errorCode: null };
      if (!CHECKOUT_EVENTS.has(event.type)) {
        return { duplicate: false, errorCode: null };
      }

      const session = event.data.object as Stripe.Checkout.Session;
      const transactionId = checkoutTransactionId(session);
      if (!transactionId) {
        await database
          .update(webhookEventsTable)
          .set({ errorCode: "transaction_id_missing" })
          .where(eq(webhookEventsTable.id, journal.id));
        return {
          duplicate: false,
          errorCode: "transaction_id_missing",
        };
      }

      const [transaction] = await database
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, transactionId))
        .limit(1);
      if (!transaction) {
        await database
          .update(webhookEventsTable)
          .set({ errorCode: "transaction_not_found" })
          .where(eq(webhookEventsTable.id, journal.id));
        return { duplicate: false, errorCode: "transaction_not_found" };
      }

      const identityError = checkoutIdentityError(session, transaction);
      if (identityError) {
        await database
          .update(webhookEventsTable)
          .set({ errorCode: identityError })
          .where(eq(webhookEventsTable.id, journal.id));
        return { duplicate: false, errorCode: identityError };
      }

      if (event.type === "checkout.session.expired") {
        await database
          .update(transactionsTable)
          .set({
            stripeCheckoutSessionId: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(transactionsTable.id, transaction.id),
              eq(transactionsTable.stripeCheckoutSessionId, session.id),
              eq(transactionsTable.status, "en_attente_paiement"),
            ),
          );
        await database
          .update(webhookEventsTable)
          .set({ status: "processed" })
          .where(eq(webhookEventsTable.id, journal.id));
        return { duplicate: false, errorCode: null };
      }

      if (event.type === "checkout.session.async_payment_failed") {
        await database
          .update(transactionsTable)
          .set({ status: "echouee", updatedAt: new Date() })
          .where(
            and(
              eq(transactionsTable.id, transaction.id),
              eq(transactionsTable.stripeCheckoutSessionId, session.id),
            ),
          );
        await database
          .update(webhookEventsTable)
          .set({ status: "processed" })
          .where(eq(webhookEventsTable.id, journal.id));
        return { duplicate: false, errorCode: null };
      }

      if (session.payment_status !== "paid") {
        await database
          .update(webhookEventsTable)
          .set({ status: "awaiting_payment" })
          .where(eq(webhookEventsTable.id, journal.id));
        return { duplicate: false, errorCode: null };
      }

      const validationError = validatePaidCheckout(
        session,
        transaction,
        eurosToCents(transaction.ttc),
      );
      if (validationError) {
        await database
          .update(webhookEventsTable)
          .set({ errorCode: validationError })
          .where(eq(webhookEventsTable.id, journal.id));
        return { duplicate: false, errorCode: validationError };
      }

      const paidAt = new Date(event.created * 1000);
      await database
        .update(transactionsTable)
        .set({
          status: "confirmee",
          stripePaymentIntentId: stripePaymentIntentId(session),
          paidAt,
          updatedAt: paidAt,
        })
        .where(
          and(
            eq(transactionsTable.id, transaction.id),
            eq(transactionsTable.stripeCheckoutSessionId, session.id),
          ),
        );

      await database
        .insert(frpMovementsTable)
        .values({
          transactionId: transaction.id,
          agencyId: transaction.agencyId,
          agencyName: transaction.agencyName,
          date: paidAt.toISOString().slice(0, 10),
          label: "Crédit FRP — 10 % HT",
          projectTitle: transaction.title,
          type: "credit",
          amount: transaction.partFrp,
        })
        .onConflictDoNothing();

      await database
        .update(webhookEventsTable)
        .set({ status: "processed", errorCode: null })
        .where(eq(webhookEventsTable.id, journal.id));
      return { duplicate: false, errorCode: null };
    });

    if (processingResult.errorCode) {
      logger.error(
        {
          eventId: event.id,
          eventType: event.type,
          errorCode: processingResult.errorCode,
        },
        "Stripe webhook stored but not applied",
      );
    }
  } catch (error) {
    logger.error(
      {
        eventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : "unknown",
      },
      "Stripe webhook processing failed",
    );
    res
      .status(500)
      .json({ error: "Traitement Stripe temporairement indisponible" });
    return;
  }

  res.sendStatus(204);
});

export default router;
