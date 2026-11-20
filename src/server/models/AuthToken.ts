import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

/** Single-use tokens for email verification and password reset. Only a SHA-256 hash is stored. */
const authTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: { type: String, enum: ["verify_email", "reset_password"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthTokenDoc = InferSchemaType<typeof authTokenSchema> & { _id: Types.ObjectId };
export const AuthToken: Model<AuthTokenDoc> =
  (models.AuthToken as Model<AuthTokenDoc>) || model<AuthTokenDoc>("AuthToken", authTokenSchema);
