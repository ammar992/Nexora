import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const ORDER_STATUSES = ["pending_payment", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const orderItemSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    title: { type: String, required: true },
    image: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const historySchema = new Schema(
  {
    status: String,
    note: String,
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

/** One order per vendor per checkout; a single Payment may cover several orders (checkoutGroup). */
const orderSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    checkoutGroup: { type: String, required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: "VendorProfile", required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v: unknown[]) => v.length > 0, message: "Order needs at least one item" },
    },
    shippingAddress: {
      name: { type: String, trim: true, maxlength: 80, default: "" },
      phone: { type: String, trim: true, maxlength: 30, default: "" },
      line1: { type: String, trim: true, maxlength: 200, default: "" },
      line2: { type: String, trim: true, maxlength: 200, default: "" },
      city: { type: String, trim: true, maxlength: 100, default: "" },
      state: { type: String, trim: true, maxlength: 100, default: "" },
      postalCode: { type: String, trim: true, maxlength: 20, default: "" },
      country: { type: String, trim: true, maxlength: 100, default: "" },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commission: { type: Number, required: true, min: 0 },
    vendorEarnings: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment", index: true },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded", "failed"], default: "unpaid", index: true },
    paymentMethod: { type: String, default: "manual" },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    trackingNumber: { type: String, trim: true, maxlength: 80, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    /** Guards against restoring stock twice when an order is cancelled / expires. */
    stockRestored: { type: Boolean, default: false },
    statusHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Order: Model<OrderDoc> = (models.Order as Model<OrderDoc>) || model<OrderDoc>("Order", orderSchema);
