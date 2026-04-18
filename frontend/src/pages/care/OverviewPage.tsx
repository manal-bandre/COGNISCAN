import { useMemo } from "react";
import { Card } from "../../components/ui/Card";
import { Link } from "react-router-dom";
import { computeSummary, getReports, getTodayTasks } from "../../lib/store";

export function OverviewPage() {
  const summary = useMemo(() => computeSummary(), []);
  const todayData = useMemo(() => getTodayTasks(), []);
  const reports = useMemo(() => getReports(), []);

  const tasksDone = todayData.tasks.filter((t) => t.status === "done").length;
  const tasksTotal = todayData.tasks.length;
  const latestScore = reports.reports[0]?.cognitiveScore ?? summary.cognitiveScore;
  const prevScore = reports.reports[1]?.cognitiveScore ?? latestScore - 3;
  const scoreChange = latestScore - prevScore;

  const recommendation = summary.riskLevel === "High"
    ? "Patient shows high cognitive risk signals. Recommend scheduling a clinical assessment and increasing daily task frequency to 5 sessions."
    : summary.riskLevel === "Moderate"
    ? "Patient shows moderate cognitive risk. Daily sessions are beneficial. Encourage completion of memory and attention tasks. Monitor speech fluency trends."
    : "Patient is performing well. Cognitive scores are stable and trending upward. Maintain current task schedule and celebrate streak milestones.";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Patient overview</h2>
        <p className="text-sm text-slate-500">Quick snapshot based on local session data.</p>
      </div>

      <Card className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-base font-semibold text-[var(--brand-dark)]">
          D
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">Demo Patient</div>
          <div className="text-xs text-slate-500">65 yrs · Last active: just now</div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            summary.riskLevel === "Low"
              ? "bg-emerald-50 text-emerald-700"
              : summary.riskLevel === "Moderate"
              ? "bg-amber-50 text-amber-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          Risk: {summary.riskScore}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-2xl font-semibold text-slate-900">
            {tasksDone}/{tasksTotal}
          </div>
          <div className="mt-1 text-xs text-slate-500">Tasks today</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-[var(--brand)]">14d</div>
          <div className="mt-1 text-xs text-slate-500">Streak</div>
        </Card>
        <Card>
          <div className={`text-2xl font-semibold ${scoreChange >= 0 ? "text-[var(--brand)]" : "text-red-600"}`}>
            {scoreChange >= 0 ? "+" : ""}{scoreChange}
          </div>
          <div className="mt-1 text-xs text-slate-500">Score change</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-slate-900">
            {summary.riskLevel === "High" ? 2 : summary.riskLevel === "Moderate" ? 1 : 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">Alerts today</div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold text-slate-900">AI recommendation</div>
        <div className="mt-2 text-sm leading-relaxed text-slate-600">{recommendation}</div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Weekly trend</div>
        <div className="mt-3 flex h-14 items-end gap-1.5">
          {summary.trend.last7Days.map((v, i, arr) => {
            const max = Math.max(...arr, 1);
            const h = Math.round((v / max) * 100);
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i === 6 ? "bg-[var(--brand)]" : "bg-emerald-200/70"}`}
                style={{ height: `${Math.max(4, h)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-slate-400">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className={i === 6 ? "font-semibold text-[var(--brand)]" : ""}>{d}</div>
          ))}
        </div>
      </Card>

      <Link
        to="/care/app/message"
        className="flex items-center justify-between rounded-2xl border border-[var(--brand)]/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-[var(--brand)] hover:bg-emerald-100 transition-colors"
      >
        <span>💬 Ask AI about this patient</span>
        <span>→</span>
      </Link>
    </div>
  );
}
