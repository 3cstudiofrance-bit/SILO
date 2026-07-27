import type Stripe from "stripe";

interface CheckoutTransaction {
  id: number;
  projectId: number | null;
  clientUserId: string | null;
  stripeCheckoutSessionId: string | null;
}

export type CheckoutValidationError =
  | "transaction_id_missing"
  | "transaction_id_mismatch"
  | "project_id_mismatch"
  | "client_id_mismatch"
  | "checkout_session_mismatch"
  | "checkout_mode_mismatch"
  | "checkout_not_complete"
  | "payment_not_paid"
  | "currency_mismatch"
  | "amount_mismatch"
  | "payment_intent_missing";

export function checkoutTransactionId(
  session: Stripe.Checkout.Session,
): number | null {
  const value = session.metadata?.transactionId;
  if (!value || !/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function checkoutIdentityError(
  session: Stripe.Checkout.Session,
  transaction: CheckoutTransaction,
): CheckoutValidationError | null {
  const transactionId = checkoutTransactionId(session);
  if (!transactionId) return "transaction_id_missing";
  if (
    transactionId !== transaction.id ||
    session.client_reference_id !== String(transaction.id)
  ) {
    return "transaction_id_mismatch";
  }
  if (session.metadata?.projectId !== String(transaction.projectId)) {
    return "project_id_mismatch";
  }
  if (
    !transaction.clientUserId ||
    session.metadata?.clientUserId !== transaction.clientUserId
  ) {
    return "client_id_mismatch";
  }
  if (session.id !== transaction.stripeCheckoutSessionId) {
    return "checkout_session_mismatch";
  }
  return null;
}

export function validatePaidCheckout(
  session: Stripe.Checkout.Session,
  transaction: CheckoutTransaction,
  expectedAmountCents: number,
): CheckoutValidationError | null {
  const identityError = checkoutIdentityError(session, transaction);
  if (identityError) return identityError;
  if (session.mode !== "payment") return "checkout_mode_mismatch";
  if (session.status !== "complete") return "checkout_not_complete";
  if (session.payment_status !== "paid") return "payment_not_paid";
  if (session.currency?.toLowerCase() !== "eur") return "currency_mismatch";
  if (
    !Number.isSafeInteger(expectedAmountCents) ||
    expectedAmountCents < 0 ||
    session.amount_total !== expectedAmountCents
  ) {
    return "amount_mismatch";
  }
  if (!stripePaymentIntentId(session)) return "payment_intent_missing";
  return null;
}

export function stripePaymentIntentId(
  session: Stripe.Checkout.Session,
): string | null {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }
  return session.payment_intent?.id ?? null;
}
