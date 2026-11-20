import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const NOTIFICATION_TYPES = ["order", "booking", "review", "vendor", "listing", "payment", "message", "system"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "system" },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 1000, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
// Auto-expire notifications after 180 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId; createdAt: Date };
export const Notification: Model<NotificationDoc> =
  (models.Notification as Model<NotificationDoc>) || model<NotificationDoc>("Notification", notificationSchema);
