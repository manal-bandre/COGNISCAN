import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await UserModel.findById(req.user!.id).lean();
    if (!user) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Invalid session" } });
      return;
    }

    if (user.role === "patient") {
      res.json({
        user: {
          id: String(user._id),
          role: user.role,
          name: user.name,
          phone: user.phone,
          patientProfile: user.patientProfile,
        },
      });
      return;
    }

    if (user.role === "caretaker" || user.role === "doctor") {
      const patientIds = (user.caretakerOf ?? []).map((l) => l.patientId);
      const patients = await UserModel.find({ _id: { $in: patientIds }, role: "patient" })
        .select({ _id: 1, name: 1, phone: 1, patientProfile: 1 })
        .lean();

      res.json({
        user: { id: String(user._id), role: user.role, name: user.name, phone: user.phone, email: user.email },
        patients: patients.map((p) => ({
          id: String(p._id),
          name: p.name,
          phone: p.phone,
          patientProfile: p.patientProfile,
        })),
      });
      return;
    }

    res.json({ user: { id: String(user._id), role: user.role, name: user.name } });
  }),
);

export default router;

