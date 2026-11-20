import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const VENDOR_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

const vendorProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, trim: true, maxlength: 140, default: "" },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    logo: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    location: {
      city: { type: String, trim: true, maxlength: 100, default: "" },
      country: { type: String, trim: true, maxlength: 100, default: "" },
    },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
    contactPhone: { type: String, trim: true, maxlength: 30, default: "" },
    website: { type: String, trim: true, maxlength: 200, default: "" },
    status: { type: String, enum: VENDOR_STATUSES, default: "pending", index: true },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: "" },
    approvedAt: { type: Date },
    payoutDetails: {
      accountName: { type: String, trim: true, maxlength: 120, default: "" },
      bankName: { type: String, trim: true, maxlength: 120, default: "" },
      accountNumberLast4: { type: String, trim: true, maxlength: 4, default: "" },
    },
    /** Denormalised stats, refreshed when reviews / orders change. */
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

vendorProfileSchema.index({ storeName: "text", tagline: "text" });

export type VendorProfileDoc = InferSchemaType<typeof vendorProfileSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const VendorProfile: Model<VendorProfileDoc> =
  (models.VendorProfile as Model<VendorProfileDoc>) || model<VendorProfileDoc>("VendorProfile", vendorProfileSchema);
