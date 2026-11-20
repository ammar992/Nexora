import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

/** Singleton document, always looked up by key "global". */
const platformSettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    siteName: { type: String, default: "Nexora", maxlength: 60 },
    tagline: { type: String, default: "Goods and services from people who care how they're made.", maxlength: 160 },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    currency: { type: String, default: "USD", maxlength: 3 },
    commissionRate: { type: Number, default: 10, min: 0, max: 60 },
    autoApproveListings: { type: Boolean, default: false },
    autoApproveVendors: { type: Boolean, default: false },
    homepage: {
      heroEyebrow: { type: String, default: "Independent makers · Vetted local pros", maxlength: 80 },
      heroTitle: { type: String, default: "Things worth keeping. People worth booking.", maxlength: 120 },
      heroSubtitle: {
        type: String,
        default:
          "Shop small-batch goods and book trusted services in one place. Every vendor is reviewed by our team, and every review comes from a real purchase.",
        maxlength: 300,
      },
      promoTitle: { type: String, default: "Open your studio on Nexora", maxlength: 100 },
      promoText: {
        type: String,
        default:
          "Sell products, take bookings, or both, from one storefront. Your dashboard tracks orders, calendars and earnings so you can get back to the work.",
        maxlength: 300,
      },
      promoCta: { type: String, default: "Apply to sell", maxlength: 40 },
    },
    contact: {
      email: { type: String, default: "hello@nexora.com", maxlength: 160 },
      phone: { type: String, default: "", maxlength: 40 },
      address: { type: String, default: "", maxlength: 300 },
    },
    social: {
      instagram: { type: String, default: "" },
      x: { type: String, default: "" },
      facebook: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    email: {
      fromName: { type: String, default: "Nexora", maxlength: 80 },
      replyTo: { type: String, default: "", maxlength: 160 },
    },
  },
  { timestamps: true }
);

export type PlatformSettingsDoc = InferSchemaType<typeof platformSettingsSchema> & { _id: Types.ObjectId };
export const PlatformSettings: Model<PlatformSettingsDoc> =
  (models.PlatformSettings as Model<PlatformSettingsDoc>) ||
  model<PlatformSettingsDoc>("PlatformSettings", platformSettingsSchema);
