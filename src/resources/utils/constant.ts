export const SESSION_COOKIE = "nx_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const PAGE_SIZE = 12;

/** A pending_payment booking/order holds stock or a slot only for this long. */
export const PAYMENT_HOLD_MINUTES = 30;

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  // generic / listing / vendor
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  archived: { label: "Archived", tone: "neutral" },
  suspended: { label: "Suspended", tone: "danger" },
  // orders
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  shipped: { label: "Shipped", tone: "accent" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
  // bookings
  confirmed: { label: "Confirmed", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  // payments
  unpaid: { label: "Unpaid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  // users
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "danger" },
  customer: { label: "Customer", tone: "neutral" },
  vendor: { label: "Vendor", tone: "accent" },
  admin: { label: "Admin", tone: "info" },
  product: { label: "Product", tone: "neutral" },
  service: { label: "Service", tone: "accent" },
};

/** Allowed order status transitions for vendors/admins. */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const BOOKING_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["pending", "confirmed", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const SORT_OPTIONS = [
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most popular" },
] as const;
