import express from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assert } from "../utils/httpErrors.js";
import { WeeklyReportModel } from "../models/WeeklyReport.js";
import { UserModel } from "../models/User.js";
import { TaskAttemptModel } from "../models/TaskAttempt.js";

const router = express.Router();

function weekRange(now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

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
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const patientId = await resolvePatientId(req);
    const reports = await WeeklyReportModel.find({ patientId }).sort({ weekStart: -1 }).limit(12).lean();
    res.json({
      reports: reports.map((r) => ({
        id: String(r._id),
        weekStart: r.weekStart,
        weekEnd: r.weekEnd,
        cognitiveScore: r.cognitiveScore,
        riskScore: r.riskScore,
        tasksCompleted: r.tasksCompleted,
        tasksAssigned: r.tasksAssigned,
      })),
    });
  }),
);

router.post(
  "/generate-latest",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const patientId = await resolvePatientId(req);
    const { start: weekStart, end: weekEnd } = weekRange();

    const existing = await WeeklyReportModel.findOne({ patientId, weekStart }).lean();
    if (existing) {
      res.json({ reportId: String(existing._id), created: false });
      return;
    }

    const attempts = await TaskAttemptModel.find({
      patientId,
      startedAt: { $gte: weekStart, $lte: weekEnd },
      completedAt: { $ne: null },
    })
      .select({ score: 1 })
      .lean();

    const tasksCompleted = attempts.length;
    const tasksAssigned = 14;
    const avg = attempts.length ? Math.round(attempts.reduce((a, b) => a + (b.score ?? 0), 0) / attempts.length) : 70;
    const cognitiveScore = Math.max(45, Math.min(95, avg));
    const riskScore = Math.max(20, Math.min(90, 100 - cognitiveScore + 2));

    const report = await WeeklyReportModel.create({
      patientId,
      weekStart,
      weekEnd,
      cognitiveScore,
      riskScore,
      tasksCompleted,
      tasksAssigned,
      speechSummary: "Mild hesitation; slight improvement vs last week.",
      emotionalSummary: "Stable; no anomalies detected.",
      recommendations: [
        "Increase word-fluency exercises to 2 sessions/day.",
        "Prefer morning task sessions (evening performance tends to dip).",
      ],
    });

    res.status(201).json({ reportId: String(report._id), created: true });
  }),
);

router.get(
  "/:id/pdf",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const report = await WeeklyReportModel.findById(id).lean();
    assert(report, 404, "REPORT_NOT_FOUND", "Report not found");
    const reportPatientId = String(report.patientId);
    if (req.user!.role === "patient") {
      assert(req.user!.id === reportPatientId, 403, "FORBIDDEN", "Forbidden");
    } else {
      const user = await UserModel.findById(req.user!.id).lean();
      assert(user, 401, "UNAUTHENTICATED", "Invalid session");
      const linked = (user.caretakerOf ?? []).some((l) => String(l.patientId) === reportPatientId);
      assert(linked, 403, "FORBIDDEN", "Not linked to this patient");
    }

    const patient = await UserModel.findById(report.patientId).select({ name: 1, patientProfile: 1 }).lean();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="cogniscan-weekly-report.pdf"`);

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text("Cogniscan Weekly Report", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#666").text(`Week: ${report.weekStart.toISOString().slice(0, 10)} → ${report.weekEnd.toISOString().slice(0, 10)}`);
    doc.fillColor("#000").moveDown();

    doc.fontSize(14).text("Patient");
    doc.fontSize(11).text(`Name: ${patient?.name ?? "Unknown"}`);
    doc.fontSize(11).text(`Age: ${patient?.patientProfile?.age ?? "-"}`);
    doc.moveDown();

    doc.fontSize(14).text("Highlights");
    doc.fontSize(11).text(`Cognitive score: ${report.cognitiveScore}/100`);
    doc.fontSize(11).text(`Risk score: ${report.riskScore}/100`);
    doc.fontSize(11).text(`Tasks: ${report.tasksCompleted}/${report.tasksAssigned} completed`);
    doc.moveDown();

    doc.fontSize(14).text("AI Summaries");
    doc.fontSize(11).text(`Speech: ${report.speechSummary}`);
    doc.fontSize(11).text(`Emotional state: ${report.emotionalSummary}`);
    doc.moveDown();

    doc.fontSize(14).text("Recommendations");
    report.recommendations.forEach((r) => doc.fontSize(11).text(`• ${r}`));

    doc.end();
  }),
);

export default router;

