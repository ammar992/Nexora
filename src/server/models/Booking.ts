import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const BOOKING_STATUSES = ["pending_payment", "pending", "confirmed", "completed", "cancelled", "refunded"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const historySchema = new Schema(
  {
    status: String,
    note: String,
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: "VendorProfile", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    listingSnapshot: {
      title: { type: String, default: "" },
      image: { type: String, default: "" },
      price: { type: Number, default: 0 },
      priceUnit: { type: String, default: "session" },
      durationMinutes: { type: Number, default: 0 },
    },
    /** YYYY-MM-DD */
    date: { type: String, required: true },
    /** HH:mm */
    timeSlot: { type: String, required: true },
    guests: { type: Number, default: 1, min: 1, max: 50 },
    contact: {
      name: { type: String, trim: true, maxlength: 80, default: "" },
      email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
      phone: { type: String, trim: true, maxlength: 30, default: "" },
    },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    subtotal: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commission: { type: Number, required: true, min: 0 },
    vendorEarnings: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending_payment", index: true },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded", "failed"], default: "unpaid", index: true },
    paymentMethod: { type: String, default: "manual" },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    statusHistory: { type: [historySchema], default: [] },
    cancellationReason: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

bookingSchema.index({ listing: 1, date: 1, timeSlot: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Booking: Model<BookingDoc> = (models.Booking as Model<BookingDoc>) || model<BookingDoc>("Booking", bookingSchema);
