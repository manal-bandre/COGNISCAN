import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assert, HttpError } from "../utils/httpErrors.js";
import { env, isProd } from "../config/env.js";
import { OtpModel } from "../models/Otp.js";
import { UserModel } from "../models/User.js";
import { generateOtpCode, hashOtp, normalizePhone, verifyOtpHash } from "../utils/otp.js";
import { signSession } from "../utils/jwt.js";

const router = express.Router();

const CookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  "/patient/register",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2),
        age: z.coerce.number().int().min(1).max(130),
        gender: z.string().min(1),
        language: z.string().min(1),
        education: z.string().min(1),
        phone: z.string().min(5),
        caretaker: z.object({
          name: z.string().min(2),
          phone: z.string().min(5),
          relationship: z.string().min(1),
        }),
      })
      .parse(req.body);

    const patientPhone = normalizePhone(body.phone);
    const caretakerPhone = normalizePhone(body.caretaker.phone);

    const existing = await UserModel.findOne({ role: "patient", phone: patientPhone }).lean();
    assert(!existing, 409, "PATIENT_EXISTS", "Patient with this phone already exists");

    const patient = await UserModel.create({
      role: "patient",
      name: body.name,
      phone: patientPhone,
      patientProfile: {
        age: body.age,
        gender: body.gender,
        language: body.language,
        education: body.education,
      },
    });

    const caretakerPassword = Math.random().toString(36).slice(2, 10) + "A1!";
    const caretakerPasswordHash = await bcrypt.hash(caretakerPassword, 10);

    await UserModel.updateOne(
      { role: "caretaker", phone: caretakerPhone },
      {
        $setOnInsert: { role: "caretaker", name: body.caretaker.name, phone: caretakerPhone, passwordHash: caretakerPasswordHash },
        $addToSet: { caretakerOf: { patientId: patient._id, relationship: body.caretaker.relationship } },
      },
      { upsert: true },
    );

    res.status(201).json({
      patient: {
        id: String(patient._id),
        name: patient.name,
        phone: patient.phone,
        role: patient.role,
      },
      caretakerLogin: isProd ? undefined : { phone: caretakerPhone, password: caretakerPassword },
      next: "REQUEST_OTP",
    });
  }),
);

router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: z.string().min(5) }).parse(req.body);
    const phone = normalizePhone(body.phone);

    const patient = await UserModel.findOne({ role: "patient", phone }).select({ _id: 1 }).lean();
    assert(patient, 404, "PATIENT_NOT_FOUND", "No patient found for this phone");

    const code = generateOtpCode();
    const codeHash = await hashOtp(code);
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OtpModel.findOneAndUpdate({ phone }, { phone, codeHash, expiresAt, attempts: 0 }, { upsert: true, new: true });

    res.json({
      ok: true,
      expiresInSec: 120,
      devOtp: isProd ? undefined : code,
    });
  }),
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const body = z.object({ phone: z.string().min(5), code: z.string().min(4).max(6) }).parse(req.body);
    const phone = normalizePhone(body.phone);

    const otp = await OtpModel.findOne({ phone });
    assert(otp, 400, "OTP_MISSING", "No OTP requested");
    if (otp.expiresAt.getTime() < Date.now()) throw new HttpError(400, "OTP_EXPIRED", "OTP expired");
    if (otp.attempts >= 5) throw new HttpError(429, "OTP_LOCKED", "Too many attempts");

    const ok = await verifyOtpHash(body.code, otp.codeHash);
    if (!ok) {
      otp.attempts += 1;
      await otp.save();
      throw new HttpError(400, "OTP_INVALID", "Invalid OTP");
    }

    await OtpModel.deleteOne({ _id: otp._id });

    const patient = await UserModel.findOne({ role: "patient", phone }).lean();
    assert(patient, 404, "PATIENT_NOT_FOUND", "No patient found for this phone");

    const token = signSession({ sub: String(patient._id), role: "patient" });
    res.cookie("session", token, CookieOptions);
    res.json({
      user: {
        id: String(patient._id),
        role: patient.role,
        name: patient.name,
        phone: patient.phone,
        patientProfile: patient.patientProfile,
      },
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = z.object({ identifier: z.string().min(3), password: z.string().min(6) }).parse(req.body);

    const identifier = body.identifier.trim();
    const isEmail = identifier.includes("@");
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: normalizePhone(identifier) };

    const user = await UserModel.findOne({ ...query, role: "caretaker" }).lean();
    assert(user, 401, "INVALID_CREDENTIALS", "Invalid credentials");
    assert(user.passwordHash, 401, "INVALID_CREDENTIALS", "Invalid credentials");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    assert(ok, 401, "INVALID_CREDENTIALS", "Invalid credentials");

    const token = signSession({ sub: String(user._id), role: user.role });
    res.cookie("session", token, CookieOptions);
    res.json({
      user: {
        id: String(user._id),
        role: user.role,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie("session", { path: "/" });
    res.json({ ok: true });
  }),
);

router.get(
  "/health",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, env: env.NODE_ENV });
  }),
);

export default router;

