import { DEFAULT_AVAILABILITY } from "./slots";

/** Shape the listing editor works with (numbers may be "" while a field is empty). */
export type ListingFormValues = {
  type: "product" | "service";
  title: string;
  summary: string;
  description: string;
  category: string;
  price: number | "";
  compareAtPrice: number | "";
  priceUnit: string;
  stock: number | "";
  sku: string;
  shippingFee: number | "";
  durationMinutes: number | "";
  availability: typeof DEFAULT_AVAILABILITY;
  location: { city: string; country: string; remote: boolean };
  tags: string[];
  highlights: string[];
  images: { url: string; publicId: string; alt: string }[];
};

/** Plain (non-client) module so server components can build initial values from it. */
export const EMPTY_LISTING: ListingFormValues = {
  type: "product", title: "", summary: "", description: "", category: "", price: "", compareAtPrice: "", priceUnit: "item",
  stock: 1, sku: "", shippingFee: 0, durationMinutes: 60, availability: DEFAULT_AVAILABILITY, location: { city: "", country: "", remote: false }, tags: [], highlights: [], images: [],
};
