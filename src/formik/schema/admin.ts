import * as yup from "yup";

const url = yup.string().trim().url("Enter a full URL").max(300).default("");
const text = (max: number) => yup.string().trim().max(max).default("");

export const adminUserUpdateSchema = yup.object({
  name: yup.string().trim().min(2).max(80).optional(),
  role: yup.string().oneOf(["customer", "vendor", "admin"]).optional(),
  isActive: yup.boolean().optional(),
  emailVerified: yup.boolean().optional(),
});

export const vendorDecisionSchema = yup.object({
  status: yup.string().oneOf(["approved", "rejected", "suspended", "pending"]).required(),
  reason: text(500),
  featured: yup.boolean().optional(),
});

export const listingModerationSchema = yup.object({
  status: yup.string().oneOf(["approved", "rejected", "archived", "pending"]).optional(),
  reason: text(500),
  featured: yup.boolean().optional(),
});

export const settingsSchema = yup.object({
  siteName: yup.string().trim().min(2).max(60).required("Site name is required"),
  tagline: text(160),
  logoUrl: url,
  faviconUrl: url,
  currency: yup.string().trim().uppercase().length(3, "Use a 3-letter ISO code like USD").required(),
  commissionRate: yup.number().typeError("Enter a percentage").min(0).max(60).required(),
  autoApproveListings: yup.boolean().default(false),
  autoApproveVendors: yup.boolean().default(false),
  homepage: yup.object({
    heroEyebrow: text(80),
    heroTitle: yup.string().trim().min(5).max(120).required("Hero headline is required"),
    heroSubtitle: text(300),
    promoTitle: text(100),
    promoText: text(300),
    promoCta: text(40),
  }),
  contact: yup.object({
    email: yup.string().trim().email("Enter a valid email").max(160).default(""),
    phone: text(40),
    address: text(300),
  }),
  social: yup.object({ instagram: url, x: url, facebook: url, linkedin: url, youtube: url }),
  email: yup.object({
    fromName: text(80),
    replyTo: yup.string().trim().email("Enter a valid email").max(160).default(""),
  }),
});
export type SettingsInput = yup.InferType<typeof settingsSchema>;
