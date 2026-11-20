import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const paymentSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["order", "booking"], required: true },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    /** "stripe" | "manual" — see src/server/payments */
    provider: { type: String, required: true },
    providerSessionId: { type: String, default: "", index: true },
    providerPaymentId: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "pending", index: true },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    failureReason: { type: String, default: "" },
    /** Who marked a manual (pay on delivery / at appointment) payment as received. */
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Payment: Model<PaymentDoc> = (models.Payment as Model<PaymentDoc>) || model<PaymentDoc>("Payment", paymentSchema);
