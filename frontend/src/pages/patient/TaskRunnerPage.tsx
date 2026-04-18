import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { TASK_CATALOG } from "../../lib/store";
import { SpeechTask } from "../../components/tasks/SpeechTask";
import { FacialTask } from "../../components/tasks/FacialTask";
import { CognitiveTask } from "../../components/tasks/CognitiveTask";

export function TaskRunnerPage() {
  const { taskKey } = useParams<{ taskKey: string }>();
  const [score, setScore] = useState<number | null>(null);

  const task = TASK_CATALOG.find((t) => t.key === taskKey);

  if (!task) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Link className="text-sm text-slate-500 hover:underline" to="/app/tasks">← Back to tasks</Link>
        <Card><div className="text-sm text-red-600">Task not found: {taskKey}</div></Card>
      </div>
    );
  }

  function handleComplete(s: number) {
    setScore(s);
  }

  const riskLabel = score !== null ? (score >= 70 ? "Low risk" : score >= 45 ? "Moderate risk" : "High risk") : null;
  const riskColor = score !== null ? (score >= 70 ? "text-[var(--brand)]" : score >= 45 ? "text-amber-600" : "text-red-600") : "";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link className="text-sm text-slate-500 hover:underline" to="/app/tasks">
        ← Back to tasks
      </Link>

      {score !== null ? (
        // ── Result screen ──────────────────────────────────────────────────
        <Card>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold text-slate-900">Task Complete!</h2>
            <p className="text-sm text-slate-500">{task.name}</p>
            <div className="mt-4 flex flex-col items-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 px-12 py-6">
              <div className="text-6xl font-extrabold text-[var(--brand)]">{score}</div>
              <div className="text-sm text-slate-500 mt-1">Score / 100</div>
              {riskLabel && <div className={`mt-2 text-xs font-semibold uppercase tracking-wide ${riskColor}`}>{riskLabel}</div>}
            </div>
            <div className="mt-4 flex gap-3 w-full">
              <Link to="/app/tasks" className="flex-1">
                <button className="w-full rounded-2xl border border-slate-200 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  More Tasks
                </button>
              </Link>
              <Link to="/app/analysis" className="flex-1">
                <button className="w-full rounded-2xl bg-[var(--brand)] py-2.5 text-sm text-white font-semibold hover:bg-[var(--brand-dark)] transition-colors">
                  View Analysis
                </button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        // ── Task runner ────────────────────────────────────────────────────
        <Card>
          {task.type === "speech" && (
            <SpeechTask taskKey={task.key} taskName={task.name} onComplete={handleComplete} />
          )}
          {task.type === "facial" && (
            <FacialTask taskKey={task.key} taskName={task.name} onComplete={handleComplete} />
          )}
          {task.type === "cognitive" && (
            <CognitiveTask taskKey={task.key} taskName={task.name} onComplete={handleComplete} />
          )}
        </Card>
      )}

      {score === null && (
        <Card className="flex items-center gap-2 bg-slate-50 text-xs text-slate-500">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          All processing happens on-device.  No data is sent to any server.
        </Card>
      )}
    </div>
  );
}
