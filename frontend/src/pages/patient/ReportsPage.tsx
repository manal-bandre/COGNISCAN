import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getReports, getResults, TASK_CATALOG } from "../../lib/store";

type Tab = "weekly" | "history";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getTaskName(key: string) {
  return TASK_CATALOG.find((t) => t.key === key)?.name ?? key;
}

function getTaskIcon(key: string) {
  const task = TASK_CATALOG.find((t) => t.key === key);
  if (!task) return "🧩";
  if (task.type === "speech") return "🎤";
  if (task.type === "facial") return "😊";
  return "🧩";
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>("weekly");
  const [tick, setTick] = useState(0);
  const reports = useMemo(() => getReports().reports, [tick]);
  const history = useMemo(() => getResults().slice(0, 30), [tick]);

  function handleRefresh() {
    setTick((t) => t + 1);
  }

  function handlePrint() {
    window.print();
  }

  const riskColor = (score: number) =>
    score < 30
      ? "bg-emerald-50 text-emerald-700"
      : score < 60
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  const scoreColor = (score: number) =>
    score >= 70 ? "text-[var(--brand)]" : score >= 45 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Your performance history and weekly summaries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="w-auto px-3 py-1.5 text-xs" onClick={handleRefresh}>
            ↻ Refresh
          </Button>
          <Button variant="secondary" className="w-auto px-3 py-1.5 text-xs" onClick={handlePrint}>
            🖨 Print
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["weekly", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px px-4 py-2 text-sm transition-colors capitalize ${
              tab === t
                ? "border-b-2 border-[var(--brand)] font-medium text-[var(--brand)]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "weekly" ? "📅 Weekly" : "📋 Session History"}
          </button>
        ))}
      </div>

      {tab === "weekly" && (
        <Card>
          <div className="text-sm font-semibold text-slate-900">Weekly reports</div>
          <div className="mt-3 divide-y divide-slate-100">
            {reports.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                No reports yet. Complete some tasks to generate your first report.
              </div>
            )}
            {reports.map((r) => (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-900">
                    {formatDate(r.weekStart)} – {formatDate(r.weekEnd)}
                  </div>
                  <button
                    onClick={handlePrint}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Print this report"
                  >
                    🖨 Print
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Score: {r.cognitiveScore}/100
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${riskColor(r.riskScore)}`}>
                    Risk: {r.riskScore}/100
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    Tasks: {r.tasksCompleted}/{r.tasksAssigned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "history" && (
        <Card>
          <div className="text-sm font-semibold text-slate-900">Session history</div>
          <div className="mt-3 divide-y divide-slate-100">
            {history.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                No sessions yet. Complete tasks to see your history here.
              </div>
            )}
            {history.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg">
                  {getTaskIcon(r.taskKey)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{getTaskName(r.taskKey)}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(r.completedAt)} · {formatTime(r.completedAt)}
                  </div>
                </div>
                <div className={`text-right font-bold text-lg ${scoreColor(r.overallScore)}`}>
                  {r.overallScore}
                  <div className="text-[10px] font-normal text-slate-400 text-right">/ 100</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        All report data is derived from on-device task sessions. No backend required.
      </Card>
    </div>
  );
}
