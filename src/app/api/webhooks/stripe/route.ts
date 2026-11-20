import type Stripe from "stripe";
import { connectDB } from "@/server/db";
import { stripeClient } from "@/server/payments/stripe";
import { Payment } from "@/server/models/Payment";
import { markPaymentPaid, cancelPayment } from "@/server/services/fulfillment";

/**
 * Stripe webhook. Configure in the Stripe dashboard to send:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.expired, checkout.session.async_payment_failed
 * to https://<your-domain>/api/webhooks/stripe and set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) return new Response("Stripe is not configured", { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  await connectDB();
  const session = event.data.object as Stripe.Checkout.Session;
  const paymentId = session.metadata?.paymentId ?? session.client_reference_id;
  if (!paymentId) return Response.json({ received: true });
  const payment = await Payment.findById(paymentId).select("_id providerSessionId").lean();
  if (!payment || (payment.providerSessionId && payment.providerSessionId !== session.id)) return Response.json({ received: true });

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (session.payment_status === "paid") {
        const intent = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? "");
        await markPaymentPaid(payment._id, { providerPaymentId: intent });
      }
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await cancelPayment(payment._id, event.type === "checkout.session.expired" ? "Payment window expired" : "Payment failed");
      break;
  }
  return Response.json({ received: true });
}
