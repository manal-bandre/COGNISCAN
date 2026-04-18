import mongoose, { type InferSchemaType } from "mongoose";

export type UserRole = "patient" | "caretaker" | "doctor";

const CaretakerLinkSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    relationship: { type: String, required: true },
  },
  { _id: false },
);

const PatientProfileSchema = new mongoose.Schema(
  {
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    language: { type: String, required: true },
    education: { type: String, required: true },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ["patient", "caretaker", "doctor"], index: true },
    name: { type: String, required: true },
    phone: { type: String, index: true, sparse: true },
    email: { type: String, index: true, sparse: true },
    passwordHash: { type: String },
    patientProfile: { type: PatientProfileSchema },
    caretakerOf: { type: [CaretakerLinkSchema], default: [] },
  },
  { timestamps: true },
);

UserSchema.index({ role: 1, phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });
UserSchema.index({ role: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel = mongoose.model("User", UserSchema);

