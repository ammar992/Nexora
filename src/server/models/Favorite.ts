import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const favoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });

export type FavoriteDoc = InferSchemaType<typeof favoriteSchema> & { _id: Types.ObjectId; createdAt: Date };
export const Favorite: Model<FavoriteDoc> =
  (models.Favorite as Model<FavoriteDoc>) || model<FavoriteDoc>("Favorite", favoriteSchema);
