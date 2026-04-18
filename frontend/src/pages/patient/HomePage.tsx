import { useMemo } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { computeSummary, computeStreak, getTodayTasks } from "../../lib/store";

export function HomePage() {
  const summary = useMemo(() => computeSummary(), []);
  const todayData = useMemo(() => getTodayTasks(), []);

  const tasksDone = todayData.tasks.filter((t) => t.status === "done").length;
  const tasksTotal = todayData.tasks.length;
  const streak = useMemo(() => computeStreak(), []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{greeting} 👋</h2>
        <p className="text-sm text-slate-500">Here's your snapshot for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white">
          <div className="text-2xl font-semibold text-slate-900">{summary.cognitiveScore}</div>
          <div className="mt-1 text-xs text-slate-500">Cognitive score</div>
        </Card>
        <Card className="bg-white">
          <div className="text-2xl font-semibold text-[var(--brand)]">{streak}</div>
          <div className="mt-1 text-xs text-slate-500">Day streak 🔥</div>
        </Card>
        <Card className="bg-white">
          <div className="text-2xl font-semibold text-slate-900">
            {tasksDone}/{tasksTotal}
          </div>
          <div className="mt-1 text-xs text-slate-500">Tasks today</div>
        </Card>
        <Card className="bg-white">
          <div
            className={`text-2xl font-semibold ${
              summary.riskLevel === "Low"
                ? "text-[var(--brand)]"
                : summary.riskLevel === "Moderate"
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {summary.riskLevel}
          </div>
          <div className="mt-1 text-xs text-slate-500">Risk level</div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Today's tasks</div>
        <div className="mt-3 divide-y divide-slate-100">
          {todayData.tasks.map((t) => (
            <div key={t.key} className="flex items-center gap-3 py-2.5">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  t.status === "done"
                    ? "border-[var(--brand)] bg-[var(--brand)]"
                    : "border-slate-300 bg-white"
                }`}
                aria-hidden="true"
              >
                {t.status === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-slate-900">{t.name}</div>
                <div className="text-xs text-slate-500">{Math.round(t.durationSec / 60)} min</div>
              </div>
              {t.status === "pending" ? (
                <Link to={`/app/tasks/${t.key}`} className="shrink-0">
                  <Button variant="primary" className="w-auto px-4 py-2 text-xs">
                    Start
                  </Button>
                </Link>
              ) : (
                <div className="text-xs font-medium text-[var(--brand)]">Done ✓</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Weekly trend</div>
        <div className="mt-3 flex h-16 items-end gap-1.5">
          {summary.trend.last7Days.map((v, i, arr) => {
            const max = Math.max(...arr, 1);
            const h = Math.round((v / max) * 100);
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all ${
                  i === 6 ? "bg-[var(--brand)]" : "bg-emerald-200/70"
                }`}
                style={{ height: `${Math.max(4, h)}%` }}
                title={`Score: ${v}`}
              />
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-slate-500">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className={i === 6 ? "font-semibold text-[var(--brand)]" : ""}>
              {d}
            </div>
          ))}
        </div>
      </Card>

      <Link to="/app/tasks">
        <Button>Start a task ↗</Button>
      </Link>
    </div>
  );
}
