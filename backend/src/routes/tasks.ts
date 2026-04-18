import express from "express";
import { z } from "zod";
import { TASKS_CATALOG } from "../domain/tasksCatalog.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assert } from "../utils/httpErrors.js";
import { TaskAttemptModel } from "../models/TaskAttempt.js";
import mongoose from "mongoose";

const router = express.Router();

function dayKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function pickTodayTasks(patientId: string, when = new Date()) {
  const seed = `${patientId}:${dayKey(when)}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const start = h % TASKS_CATALOG.length;
  const picks: typeof TASKS_CATALOG = [];
  for (let i = 0; i < Math.min(3, TASKS_CATALOG.length); i++) {
    picks.push(TASKS_CATALOG[(start + i) % TASKS_CATALOG.length]!);
  }
  return picks;
}

router.get(
  "/catalog",
  requireAuth,
  asyncHandler(async (_req: AuthedRequest, res) => {
    res.json({
      tasks: TASKS_CATALOG.map((t) => ({
        key: t.key,
        name: t.name,
        domain: t.domain,
        difficulty: t.difficulty,
        durationSec: t.durationSec,
        description: t.description,
      })),
    });
  }),
);

router.get(
  "/today",
  requireAuth,
  requireRole("patient"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const today = pickTodayTasks(req.user!.id);
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const attempts = await TaskAttemptModel.find({ patientId: req.user!.id, startedAt: { $gte: since } })
      .select({ taskKey: 1, completedAt: 1 })
      .lean();

    const completed = new Set(attempts.filter((a) => a.completedAt).map((a) => a.taskKey));
    res.json({
      date: dayKey(new Date()),
      tasks: today.map((t) => ({
        key: t.key,
        name: t.name,
        domain: t.domain,
        difficulty: t.difficulty,
        durationSec: t.durationSec,
        description: t.description,
        status: completed.has(t.key) ? "done" : "pending",
      })),
    });
  }),
);

router.post(
  "/:taskKey/start",
  requireAuth,
  requireRole("patient"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { taskKey } = z.object({ taskKey: z.string().min(1) }).parse(req.params);
    const task = TASKS_CATALOG.find((t) => t.key === taskKey);
    assert(task, 404, "TASK_NOT_FOUND", "Task not found");

    const attempt = await TaskAttemptModel.create({
      patientId: new mongoose.Types.ObjectId(req.user!.id),
      taskKey: task.key,
      taskName: task.name,
      domain: task.domain,
      durationSec: task.durationSec,
      startedAt: new Date(),
    });

    res.status(201).json({
      attempt: {
        id: String(attempt._id),
        taskKey: attempt.taskKey,
        startedAt: attempt.startedAt,
        prompt: task.prompt,
      },
    });
  }),
);

router.post(
  "/attempts/:attemptId/complete",
  requireAuth,
  requireRole("patient"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { attemptId } = z.object({ attemptId: z.string().min(1) }).parse(req.params);
    const body = z.object({ inputText: z.string().optional() }).parse(req.body);

    const attempt = await TaskAttemptModel.findOne({ _id: attemptId, patientId: req.user!.id });
    assert(attempt, 404, "ATTEMPT_NOT_FOUND", "Attempt not found");
    assert(!attempt.completedAt, 409, "ALREADY_COMPLETED", "Attempt already completed");

    const score = Math.max(50, Math.min(95, 70 + Math.round(Math.random() * 20)));
    attempt.completedAt = new Date();
    if (body.inputText !== undefined) attempt.inputText = body.inputText;
    attempt.score = score;
    await attempt.save();

    res.json({ ok: true, score });
  }),
);

export default router;

