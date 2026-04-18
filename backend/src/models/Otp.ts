import mongoose, { type InferSchemaType } from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpDoc = InferSchemaType<typeof OtpSchema> & { _id: mongoose.Types.ObjectId };
export const OtpModel = mongoose.model("Otp", OtpSchema);

