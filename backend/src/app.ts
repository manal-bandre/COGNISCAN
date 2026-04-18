import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env, isProd } from "./config/env.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import tasksRouter from "./routes/tasks.js";
import analysisRouter from "./routes/analysis.js";
import reportsRouter from "./routes/reports.js";
import careRouter from "./routes/care.js";
import aiRouter from "./routes/ai.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      ...(isProd ? {} : { contentSecurityPolicy: false }),
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin === env.FRONTEND_ORIGIN) return callback(null, true);
        if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/analysis", analysisRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/care", careRouter);
  app.use("/api/ai", aiRouter);

  app.use(errorHandler);
  return app;
}

