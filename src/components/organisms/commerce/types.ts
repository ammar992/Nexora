export type Audience = "customer" | "vendor" | "admin";

export type Person = { _id: string; name: string; email: string; avatar?: string; phone?: string } | null;
export type History = { status: string; note?: string; at: string }[];

export type OrderRow = {
  _id: string;
  reference: string;
  customer: Person;
  vendor: { _id: string; storeName: string; slug: string } | null;
  items: { listing: string; title: string; image: string; unitPrice: number; quantity: number; lineTotal: number }[];
  shippingAddress: { name: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string };
  subtotal: number;
  shippingFee: number;
  total: number;
  commission: number;
  vendorEarnings: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber: string;
  notes: string;
  statusHistory: History;
  createdAt: string;
};

export type BookingRow = {
  _id: string;
  reference: string;
  customer: Person;
  vendor: { _id: string; storeName: string; slug: string } | null;
  listing: { _id: string; slug: string } | null;
  listingSnapshot: { title: string; image: string; price: number; priceUnit: string; durationMinutes: number };
  date: string;
  timeSlot: string;
  guests: number;
  contact: { name: string; email: string; phone: string };
  notes: string;
  total: number;
  commission: number;
  vendorEarnings: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  cancellationReason: string;
  statusHistory: History;
  createdAt: string;
};
