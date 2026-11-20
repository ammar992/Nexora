import { Schema, model, models, type Model } from "mongoose";

/** Fixed-window counters shared across server instances; expired windows are removed by a TTL index. */
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type RateLimitDoc = { key: string; count: number; expiresAt: Date };
export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc>) || model<RateLimitDoc>("RateLimit", rateLimitSchema);
