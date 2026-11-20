import * as yup from "yup";

const time = yup.string().matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

export const availabilitySchema = yup.object({
  days: yup.array(yup.number().integer().min(0).max(6).required()).min(1, "Pick at least one day").required(),
  startTime: time.required(),
  endTime: time
    .required()
    .test("after", "End time must be after start time", function (v) {
      return !v || !this.parent.startTime || v > this.parent.startTime;
    }),
  slotMinutes: yup.number().integer().min(15).max(1440).required(),
  capacityPerSlot: yup.number().integer().min(1).max(500).required(),
  blockedDates: yup.array(yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).required()).default([]),
  leadTimeHours: yup.number().integer().min(0).max(720).default(2),
  maxAdvanceDays: yup.number().integer().min(1).max(365).default(60),
});

export const listingSchema = yup.object({
  type: yup.string().oneOf(["product", "service"]).required(),
  title: yup.string().trim().min(3, "Title is too short").max(120).required("Title is required"),
  summary: yup.string().trim().max(200).default(""),
  description: yup.string().trim().min(20, "Describe it in at least 20 characters").max(5000).required("Description is required"),
  category: yup.string().required("Choose a category"),
  price: yup.number().typeError("Enter a price").min(0).max(1_000_000).required("Price is required"),
  compareAtPrice: yup
    .number()
    .transform((v, o) => (o === "" || o === null ? undefined : v))
    .min(0)
    .optional()
    .test("gt", "Compare-at price should be higher than the price", function (v) {
      return v === undefined || v > this.parent.price;
    }),
  priceUnit: yup.string().oneOf(["item", "session", "hour", "day", "person"]).default("item"),
  stock: yup.number().integer().min(0).max(1_000_000).when("type", { is: "product", then: (s) => s.required("Stock is required"), otherwise: (s) => s.default(0) }),
  sku: yup.string().trim().max(60).default(""),
  shippingFee: yup.number().min(0).max(10_000).default(0),
  durationMinutes: yup.number().integer().min(0).max(1440).when("type", { is: "service", then: (s) => s.required("Duration is required"), otherwise: (s) => s.optional() }),
  availability: availabilitySchema.when("type", { is: "service", then: (s) => s.required(), otherwise: () => yup.mixed().strip() }),
  location: yup.object({
    city: yup.string().trim().max(100).default(""),
    country: yup.string().trim().max(100).default(""),
    remote: yup.boolean().default(false),
  }),
  tags: yup.array(yup.string().trim().lowercase().max(30).required()).max(12, "Up to 12 tags").default([]),
  highlights: yup.array(yup.string().trim().max(120).required()).max(8, "Up to 8 highlights").default([]),
  images: yup
    .array(yup.object({ url: yup.string().url().required(), publicId: yup.string().default(""), alt: yup.string().max(160).default("") }))
    .min(1, "Add at least one photo")
    .max(8, "Up to 8 photos")
    .required(),
  /** "draft" saves privately, "pending" submits for review. */
  submit: yup.string().oneOf(["draft", "pending"]).default("pending"),
});
export type ListingInput = yup.InferType<typeof listingSchema>;

export const categorySchema = yup.object({
  name: yup.string().trim().min(2).max(60).required("Name is required"),
  description: yup.string().trim().max(300).default(""),
  icon: yup.string().trim().max(40).default("Sparkles"),
  image: yup.string().trim().url().max(300).default(""),
  type: yup.string().oneOf(["product", "service", "both"]).default("both"),
  isActive: yup.boolean().default(true),
  sortOrder: yup.number().integer().min(0).max(999).default(0),
});

export const reviewSchema = yup.object({
  rating: yup.number().integer().min(1, "Pick a rating").max(5).required("Pick a rating"),
  title: yup.string().trim().max(100).default(""),
  comment: yup.string().trim().min(10, "Share at least a sentence (10+ characters)").max(2000).required("Write a few words"),
});
