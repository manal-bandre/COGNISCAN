import express from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assert } from "../utils/httpErrors.js";
import { TaskAttemptModel } from "../models/TaskAttempt.js";
import { UserModel } from "../models/User.js";

const router = express.Router();

async function resolvePatientId(req: AuthedRequest) {
  const qp = z.object({ patientId: z.string().optional() }).parse(req.query);
  if (req.user!.role === "patient") return req.user!.id;
  assert(qp.patientId, 400, "PATIENT_REQUIRED", "patientId is required");

  const user = await UserModel.findById(req.user!.id).lean();
  assert(user, 401, "UNAUTHENTICATED", "Invalid session");
  const linked = (user.caretakerOf ?? []).some((l) => String(l.patientId) === qp.patientId);
  assert(linked, 403, "FORBIDDEN", "Not linked to this patient");
  return qp.patientId;
}

router.get(
  "/summary",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const patientId = await resolvePatientId(req);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const attempts = await TaskAttemptModel.find({ patientId, startedAt: { $gte: since }, completedAt: { $ne: null } })
      .select({ score: 1, domain: 1, startedAt: 1 })
      .lean();

    const avgScore = attempts.length ? Math.round(attempts.reduce((a, b) => a + (b.score ?? 0), 0) / attempts.length) : 70;
    const cognitiveScore = Math.max(45, Math.min(95, avgScore));
    const riskScore = Math.max(20, Math.min(90, 100 - cognitiveScore + Math.round(Math.random() * 6)));

    res.json({
      cognitiveScore,
      riskScore,
      riskLevel: riskScore < 40 ? "Low" : riskScore < 70 ? "Moderate" : "High",
      speech: {
        speechRateWpm: 145,
        pauseFreqPerMin: 3.2,
        wordRecall: "Slight hesitation",
        fluencyScore: Math.max(50, Math.min(95, cognitiveScore + 6)),
      },
      facial: {
        stress: "Low",
        emotionalState: "Calm",
        microExpressions: "Normal",
        engagement: "High",
      },
      cognitive: {
        reactionTimeMs: 480,
        memoryRetentionPct: Math.max(40, Math.min(95, cognitiveScore - 4)),
        patternRecognitionPct: Math.max(40, Math.min(95, cognitiveScore + 9)),
        decisionMakingPct: Math.max(40, Math.min(95, cognitiveScore + 2)),
      },
      trend: {
        last7Days: Array.from({ length: 7 }, (_v, i) => {
          const base = cognitiveScore - 10 + i * 2;
          return Math.max(35, Math.min(95, base + Math.round(Math.random() * 5)));
        }),
      },
    });
  }),
);

router.get(
  "/risk-breakdown",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const patientId = await resolvePatientId(req);
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const attempts = await TaskAttemptModel.find({ patientId, startedAt: { $gte: since }, completedAt: { $ne: null } })
      .select({ score: 1, domain: 1 })
      .lean();

    const base = attempts.length ? Math.round(attempts.reduce((a, b) => a + (b.score ?? 0), 0) / attempts.length) : 70;
    const speech = Math.max(50, Math.min(90, base - 5));
    const facial = Math.max(50, Math.min(90, base + 8));
    const cognitive = Math.max(50, Math.min(90, base));
    const behavioral = Math.max(50, Math.min(90, base - 2));

    res.json({
      breakdown: [
        { key: "speech", label: "Speech", score: speech, range: speech < 60 ? "Low" : speech < 75 ? "Low–Mod" : "Moderate" },
        { key: "facial", label: "Facial", score: facial, range: facial < 60 ? "Low" : facial < 75 ? "Low–Mod" : "Moderate" },
        { key: "cognitive", label: "Cognitive", score: cognitive, range: cognitive < 60 ? "Low" : cognitive < 75 ? "Low–Mod" : "Moderate" },
        { key: "behavioral", label: "Behavioral", score: behavioral, range: behavioral < 60 ? "Low" : behavioral < 75 ? "Low–Mod" : "Moderate" },
      ],
    });
  }),
);

export default router;

