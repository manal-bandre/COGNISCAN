import mongoose, { type InferSchemaType } from "mongoose";

const WeeklyReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: Date, required: true, index: true },
    weekEnd: { type: Date, required: true },
    cognitiveScore: { type: Number, required: true },
    riskScore: { type: Number, required: true },
    tasksCompleted: { type: Number, required: true },
    tasksAssigned: { type: Number, required: true },
    speechSummary: { type: String, required: true },
    emotionalSummary: { type: String, required: true },
    recommendations: { type: [String], default: [] },
  },
  { timestamps: true },
);

WeeklyReportSchema.index({ patientId: 1, weekStart: -1 }, { unique: true });

export type WeeklyReportDoc = InferSchemaType<typeof WeeklyReportSchema> & { _id: mongoose.Types.ObjectId };
export const WeeklyReportModel = mongoose.model("WeeklyReport", WeeklyReportSchema);

