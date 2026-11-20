import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const reviewSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: "VendorProfile", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100, default: "" },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    /** True when the author has a completed order / booking for this listing. */
    verified: { type: Boolean, default: false },
    vendorReply: {
      text: { type: String, trim: true, maxlength: 1000, default: "" },
      at: { type: Date },
    },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per customer per listing.
reviewSchema.index({ listing: 1, author: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof reviewSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Review: Model<ReviewDoc> = (models.Review as Model<ReviewDoc>) || model<ReviewDoc>("Review", reviewSchema);
