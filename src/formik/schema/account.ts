import * as yup from "yup";

const optional = (max: number) => yup.string().trim().max(max).default("");
const url = yup.string().trim().url("Enter a full URL starting with https://").max(300).default("");

export const addressSchema = yup.object({
  line1: optional(200),
  line2: optional(200),
  city: optional(100),
  state: optional(100),
  postalCode: optional(20),
  country: optional(100),
});

export const profileSchema = yup.object({
  name: yup.string().trim().min(2, "Name is too short").max(80).required("Your name is required"),
  phone: yup.string().trim().max(30).matches(/^[+\d\s()-]*$/, "Use digits, spaces and + ( ) - only").default(""),
  bio: optional(500),
  avatar: url,
  address: addressSchema.default({}),
});

export const preferencesSchema = yup.object({
  emailNotifications: yup.boolean().required(),
  marketingEmails: yup.boolean().required(),
});

export const vendorApplicationSchema = yup.object({
  storeName: yup.string().trim().min(2, "Store name is too short").max(80).required("Give your store a name"),
  tagline: optional(140),
  description: yup.string().trim().min(30, "Tell customers a bit more (30+ characters)").max(2000).required("Describe what you offer"),
  city: yup.string().trim().max(100).required("City is required"),
  country: yup.string().trim().max(100).required("Country is required"),
  contactEmail: yup.string().trim().lowercase().email("Enter a valid email").max(160).required("Contact email is required"),
  contactPhone: yup.string().trim().max(30).matches(/^[+\d\s()-]*$/, "Use digits, spaces and + ( ) - only").default(""),
  website: url,
});

export const vendorProfileSchema = vendorApplicationSchema.shape({
  logo: url,
  coverImage: url,
  payoutAccountName: optional(120),
  payoutBankName: optional(120),
  payoutAccountLast4: yup.string().trim().matches(/^\d{0,4}$/, "Last 4 digits only").default(""),
});

export const inquirySchema = yup.object({
  message: yup.string().trim().min(10, "Write at least 10 characters").max(1500).required("Write your question"),
});
