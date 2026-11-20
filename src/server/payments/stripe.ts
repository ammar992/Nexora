import "server-only";
import Stripe from "stripe";
import type { PaymentProvider } from "./types";

let client: Stripe | null = null;

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (!client) client = new Stripe(key);
  return client;
}

/** Card payments through Stripe Checkout. Card details never touch our servers. */
export const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Card (Stripe)",
  description: "Pay securely by card. You'll be redirected to Stripe to complete payment.",
  isAvailable: () => Boolean(process.env.STRIPE_SECRET_KEY),
  async createCheckout(input) {
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail,
      client_reference_id: input.paymentId,
      metadata: { paymentId: input.paymentId, reference: input.reference },
      line_items: input.lineItems.map((li) => ({
        quantity: li.quantity,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: Math.round(li.unitAmount * 100),
          product_data: { name: li.name, images: li.image ? [li.image] : undefined },
        },
      })),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { type: "redirect", url: session.url, sessionId: session.id };
  },
  async refund(providerPaymentId, amount) {
    await stripeClient().refunds.create({
      payment_intent: providerPaymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  },
};
