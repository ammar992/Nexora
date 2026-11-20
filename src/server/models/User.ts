import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const ROLES = ["customer", "vendor", "admin"] as const;
export type Role = (typeof ROLES)[number];

const addressSchema = new Schema(
  {
    line1: { type: String, trim: true, maxlength: 200, default: "" },
    line2: { type: String, trim: true, maxlength: 200, default: "" },
    city: { type: String, trim: true, maxlength: 100, default: "" },
    state: { type: String, trim: true, maxlength: 100, default: "" },
    postalCode: { type: String, trim: true, maxlength: 20, default: "" },
    country: { type: String, trim: true, maxlength: 100, default: "" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer", index: true },
    avatar: { type: String, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    bio: { type: String, trim: true, maxlength: 500, default: "" },
    address: { type: addressSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true, index: true },
    emailVerified: { type: Boolean, default: false },
    /** Incremented on password change / deactivation to invalidate existing sessions. */
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.index({ name: "text", email: "text" });
userSchema.index({ createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
