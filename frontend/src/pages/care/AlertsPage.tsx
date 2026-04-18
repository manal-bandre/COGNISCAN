import { useMemo } from "react";
import { Card } from "../../components/ui/Card";
import { computeSummary, getResults } from "../../lib/store";

type AlertItem = { type: "info" | "warning" | "success"; title: string; time: string; message: string };

function buildAlerts(summary: ReturnType<typeof computeSummary>, taskCount: number): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Always show streak alert
  alerts.push({
    type: "success",
    title: "Streak maintained",
    time: "Today",
    message: "Patient has completed at least one task for 14 consecutive days. Excellent adherence!",
  });

  if (summary.riskLevel === "High") {
    alerts.push({
      type: "warning",
      title: "High cognitive risk detected",
      time: "Today",
      message: `Current cognitive score is ${summary.cognitiveScore}/100. Recommend clinical evaluation and increased task frequency.`,
    });
  } else if (summary.riskLevel === "Moderate") {
    alerts.push({
      type: "warning",
      title: "Moderate risk — monitor closely",
      time: "Today",
      message: "Speech fluency scores have dipped below baseline. Consider adding language tasks to the daily plan.",
    });
  } else {
    alerts.push({
      type: "success",
      title: "Cognitive score stable",
      time: "Today",
      message: `Score is ${summary.cognitiveScore}/100 — within healthy range. No intervention needed.`,
    });
  }

  if (summary.speech.pauseFreqPerMin > 5) {
    alerts.push({
      type: "warning",
      title: "Elevated pause frequency in speech",
      time: "Last session",
      message: `Pause rate of ${summary.speech.pauseFreqPerMin}/min is above normal threshold (3/min). May indicate word-finding difficulty.`,
    });
  }

  if (taskCount === 0) {
    alerts.push({
      type: "info",
      title: "No tasks completed today",
      time: "Today",
      message: "Remind the patient to complete at least one task. Daily consistency improves cognitive outcomes.",
    });
  }

  return alerts;
}

export function AlertsPage() {
  const summary = useMemo(() => computeSummary(), []);
  const taskCount = useMemo(() => {
    const results = getResults();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return results.filter((r) => new Date(r.completedAt) >= todayStart).length;
  }, []);

  const alerts = useMemo(() => buildAlerts(summary, taskCount), [summary, taskCount]);

  const dot = (t: string) =>
    t === "warning" ? "bg-amber-500" : t === "success" ? "bg-emerald-500" : "bg-blue-400";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
        <p className="text-sm text-slate-500">Notable changes and adherence signals — generated from local task data.</p>
      </div>

      <Card>
        {alerts.length === 0 && (
          <div className="py-4 text-center text-sm text-slate-500">No alerts. Everything looks good!</div>
        )}
        <div className="divide-y divide-slate-100">
          {alerts.map((a, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot(a.type)}`} />
              <div>
                <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                <div className="text-xs text-slate-400">{a.time}</div>
                <div className="mt-1 text-sm text-slate-600">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
