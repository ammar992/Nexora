import { Schema, model, models, type Model } from "mongoose";

/** Newsletter subscribers collected from the homepage form. */
const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    source: { type: String, default: "homepage" },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);

type SubscriberDoc = { email: string; source: string; unsubscribedAt?: Date; createdAt: Date };
export const Subscriber: Model<SubscriberDoc> =
  (models.Subscriber as Model<SubscriberDoc>) || model<SubscriberDoc>("Subscriber", subscriberSchema);
