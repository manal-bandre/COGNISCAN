import express from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assert } from "../utils/httpErrors.js";
import { UserModel } from "../models/User.js";

const router = express.Router();

router.post(
  "/message",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = z.object({ patientId: z.string().optional(), message: z.string().min(1).max(2000) }).parse(req.body);

    if (req.user!.role === "patient") {
      res.json({
        reply:
          "I’m here to help. Based on your recent sessions, attention tasks are trending positively. Would you like a short routine for tomorrow morning?",
      });
      return;
    }

    assert(body.patientId, 400, "PATIENT_REQUIRED", "patientId is required");
    const user = await UserModel.findById(req.user!.id).lean();
    assert(user, 401, "UNAUTHENTICATED", "Invalid session");
    const linked = (user.caretakerOf ?? []).some((l) => String(l.patientId) === body.patientId);
    assert(linked, 403, "FORBIDDEN", "Not linked to this patient");

    res.json({
      reply:
        "Based on the last 7 days, the patient’s cognitive score is stable with a slight upward trend. Morning sessions are consistently stronger. Consider nudging completion of one extra language task this week.",
    });
  }),
);

export default router;

