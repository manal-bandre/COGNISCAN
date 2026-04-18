import mongoose, { type InferSchemaType } from "mongoose";

const TaskAttemptSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskKey: { type: String, required: true, index: true },
    taskName: { type: String, required: true },
    domain: { type: String, required: true },
    durationSec: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    inputText: { type: String },
    score: { type: Number },
  },
  { timestamps: true },
);

TaskAttemptSchema.index({ patientId: 1, startedAt: -1 });

export type TaskAttemptDoc = InferSchemaType<typeof TaskAttemptSchema> & { _id: mongoose.Types.ObjectId };
export const TaskAttemptModel = mongoose.model("TaskAttempt", TaskAttemptSchema);

