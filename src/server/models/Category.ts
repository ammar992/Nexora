import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    /** Name of a lucide-react icon, e.g. "Sofa". */
    icon: { type: String, trim: true, default: "Sparkles" },
    image: { type: String, default: "" },
    type: { type: String, enum: ["product", "service", "both"], default: "both" },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export type CategoryDoc = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId; createdAt: Date };
export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) || model<CategoryDoc>("Category", categorySchema);
