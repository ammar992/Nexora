import * as yup from "yup";

export const shippingAddressSchema = yup.object({
  name: yup.string().trim().min(2, "Enter the recipient's name").max(80).required("Recipient name is required"),
  phone: yup.string().trim().max(30).matches(/^[+\d\s()-]*$/, "Use digits, spaces and + ( ) - only").required("Phone is required"),
  line1: yup.string().trim().min(3, "Enter a street address").max(200).required("Street address is required"),
  line2: yup.string().trim().max(200).default(""),
  city: yup.string().trim().max(100).required("City is required"),
  state: yup.string().trim().max(100).default(""),
  postalCode: yup.string().trim().max(20).required("Postal code is required"),
  country: yup.string().trim().max(100).required("Country is required"),
});

export const cartCheckoutSchema = yup.object({
  items: yup
    .array(
      yup.object({
        listingId: yup.string().required(),
        quantity: yup.number().integer().min(1).max(99).required(),
      })
    )
    .min(1, "Your cart is empty")
    .max(50)
    .required(),
  shippingAddress: shippingAddressSchema.required(),
  provider: yup.string().oneOf(["stripe", "manual"]).required("Choose a payment method"),
  notes: yup.string().trim().max(1000).default(""),
});

export const bookingCheckoutSchema = yup.object({
  listingId: yup.string().required(),
  date: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Pick a date").required("Pick a date"),
  timeSlot: yup.string().matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time").required("Pick a time"),
  guests: yup.number().integer().min(1).max(50).default(1),
  contact: yup
    .object({
      name: yup.string().trim().min(2).max(80).required("Your name is required"),
      email: yup.string().trim().lowercase().email("Enter a valid email").max(160).required("Email is required"),
      phone: yup.string().trim().max(30).matches(/^[+\d\s()-]*$/, "Use digits, spaces and + ( ) - only").default(""),
    })
    .required(),
  notes: yup.string().trim().max(1000).default(""),
  provider: yup.string().oneOf(["stripe", "manual"]).required("Choose a payment method"),
});

export const statusUpdateSchema = yup.object({
  status: yup.string().required(),
  note: yup.string().trim().max(500).default(""),
  trackingNumber: yup.string().trim().max(80).default(""),
});
