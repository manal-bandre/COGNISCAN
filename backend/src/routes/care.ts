import express from "express";
import { z } from "zod";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assert } from "../utils/httpErrors.js";
import { UserModel } from "../models/User.js";
import { TaskAttemptModel } from "../models/TaskAttempt.js";

const router = express.Router();

async function assertLinked(req: AuthedRequest, patientId: string) {
  const user = await UserModel.findById(req.user!.id).lean();
  assert(user, 401, "UNAUTHENTICATED", "Invalid session");
  const ok = (user.caretakerOf ?? []).some((l) => String(l.patientId) === patientId);
  assert(ok, 403, "FORBIDDEN", "Not linked to this patient");
}

router.get(
  "/patients/:patientId/overview",
  requireAuth,
  requireRole("caretaker", "doctor"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { patientId } = z.object({ patientId: z.string().min(1) }).parse(req.params);
    await assertLinked(req, patientId);

    const patient = await UserModel.findById(patientId).lean();
    assert(patient && patient.role === "patient", 404, "PATIENT_NOT_FOUND", "Patient not found");

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const attemptsToday = await TaskAttemptModel.find({ patientId, startedAt: { $gte: since } }).lean();
    const completedToday = attemptsToday.filter((a) => a.completedAt).length;
    const assignedToday = 3;

    res.json({
      patient: {
        id: String(patient._id),
        name: patient.name,
        lastActiveAgoMin: 120,
        age: patient.patientProfile?.age,
      },
      metrics: {
        tasksToday: `${completedToday}/${assignedToday}`,
        streakDays: 14,
        scoreChange: +5,
        alertsToday: 0,
      },
      recommendation:
        "Shows mild hesitation in speech tasks. Recommend increasing word-fluency exercises. Evening performance is notably lower — consider rescheduling tasks to morning hours.",
    });
  }),
);

router.get(
  "/patients/:patientId/alerts",
  requireAuth,
  requireRole("caretaker", "doctor"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { patientId } = z.object({ patientId: z.string().min(1) }).parse(req.params);
    await assertLinked(req, patientId);

    res.json({
      alerts: [
        { type: "info", title: "Task skipped", time: "Yesterday, 4pm", message: "Memory recall task was not completed." },
        { type: "warning", title: "Risk increase", time: "Apr 10", message: "Score increased from 65 to 72 in 3 days." },
        { type: "success", title: "Streak milestone", time: "Apr 8", message: "Completed 14 consecutive days." },
      ],
    });
  }),
);

export default router;

