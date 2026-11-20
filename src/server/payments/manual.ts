import type { PaymentProvider } from "./types";

/**
 * Offline payment: nothing is charged online. The payment stays "pending" until the vendor
 * or an admin records that money was received (e.g. cash on delivery, pay at appointment).
 */
export const manualProvider: PaymentProvider = {
  id: "manual",
  label: "Pay on delivery / at appointment",
  description: "Pay the vendor directly when your order arrives or at your appointment.",
  isAvailable: () => true,
  async createCheckout() {
    return { type: "offline" };
  },
  async refund() {
    // Recorded in our database only; money is returned by the vendor directly.
  },
};
