import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const LISTING_TYPES = ["product", "service"] as const;
export const LISTING_STATUSES = ["draft", "pending", "approved", "rejected", "archived"] as const;
export const PRICE_UNITS = ["item", "session", "hour", "day", "person"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    /** 0 = Sunday … 6 = Saturday */
    days: { type: [Number], default: [1, 2, 3, 4, 5] },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" },
    slotMinutes: { type: Number, default: 60, min: 15, max: 1440 },
    capacityPerSlot: { type: Number, default: 1, min: 1, max: 500 },
    /** YYYY-MM-DD dates the vendor is unavailable. */
    blockedDates: { type: [String], default: [] },
    leadTimeHours: { type: Number, default: 2, min: 0, max: 720 },
    maxAdvanceDays: { type: Number, default: 60, min: 1, max: 365 },
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "VendorProfile", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    type: { type: String, enum: LISTING_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, trim: true, maxlength: 200, default: "" },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    images: { type: [imageSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    priceUnit: { type: String, enum: PRICE_UNITS, default: "item" },
    currency: { type: String, default: "USD", uppercase: true, maxlength: 3 },
    // Products
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true, maxlength: 60, default: "" },
    shippingFee: { type: Number, default: 0, min: 0 },
    // Services
    durationMinutes: { type: Number, min: 0 },
    availability: { type: availabilitySchema, default: undefined },
    location: {
      city: { type: String, trim: true, maxlength: 100, default: "" },
      country: { type: String, trim: true, maxlength: 100, default: "" },
      remote: { type: Boolean, default: false },
    },
    tags: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    status: { type: String, enum: LISTING_STATUSES, default: "pending", index: true },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: "" },
    featured: { type: Boolean, default: false, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index(
  { title: "text", summary: "text", description: "text", tags: "text" },
  { weights: { title: 10, tags: 5, summary: 3, description: 1 }, name: "listing_text" }
);
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, price: 1 });
listingSchema.index({ status: 1, rating: -1 });
listingSchema.index({ status: 1, salesCount: -1 });
listingSchema.index({ "location.city": 1 });

export type ListingDoc = InferSchemaType<typeof listingSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Listing: Model<ListingDoc> = (models.Listing as Model<ListingDoc>) || model<ListingDoc>("Listing", listingSchema);
