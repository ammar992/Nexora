export type PaymentLineItem = { name: string; unitAmount: number; quantity: number; image?: string };

export type CreateCheckoutInput = {
  paymentId: string;
  reference: string;
  currency: string;
  customerEmail: string;
  lineItems: PaymentLineItem[];
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutResult =
  /** Redirect the customer to a hosted payment page. */
  | { type: "redirect"; url: string; sessionId: string }
  /** Payment is collected offline (on delivery / at the appointment). */
  | { type: "offline" };

export interface PaymentProvider {
  id: "stripe" | "manual";
  label: string;
  description: string;
  isAvailable(): boolean;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  /** Issue a refund for a captured payment. Offline providers just record it. */
  refund(providerPaymentId: string, amount?: number): Promise<void>;
}
