import "server-only";
import { manualProvider } from "./manual";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

/**
 * Registry of payment providers. To add one (PayPal, a local gateway, …) implement
 * PaymentProvider and add it here; checkout and refunds pick it up automatically.
 */
const PROVIDERS: PaymentProvider[] = [stripeProvider, manualProvider];

export function availableProviders() {
  return PROVIDERS.filter((p) => p.isAvailable()).map((p) => ({ id: p.id, label: p.label, description: p.description }));
}

export function getProvider(id: string): PaymentProvider | null {
  const p = PROVIDERS.find((x) => x.id === id);
  return p && p.isAvailable() ? p : null;
}

export type { PaymentProvider } from "./types";
