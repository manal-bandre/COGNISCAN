import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { TASK_CATALOG, getTodayTasks } from "../../lib/store";

const ICONS: Record<string, string> = {
  speech: "🎤",
  facial: "😊",
  cognitive: "🧩",
};

const DOMAIN_COLORS: Record<string, string> = {
  Memory: "bg-blue-50 text-blue-700",
  Language: "bg-emerald-50 text-emerald-700",
  Attention: "bg-amber-50 text-amber-700",
  Motor: "bg-purple-50 text-purple-700",
};

type Domain = "All" | "Memory" | "Language" | "Attention" | "Motor";

export function TasksPage() {
  const [filter, setFilter] = useState<Domain>("All");
  const todayData = getTodayTasks();
  const doneTodayKeys = new Set(todayData.tasks.filter((t) => t.status === "done").map((t) => t.key));

  const tasks = useMemo(() => {
    const all = TASK_CATALOG;
    if (filter === "All") return all;
    return all.filter((t) => t.domain === filter);
  }, [filter]);

  const filters: Domain[] = ["All", "Memory", "Language", "Attention", "Motor"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Cognitive Tasks</h2>
        <p className="text-sm text-slate-500">Pick a task below — speech, facial expression, or cognitive challenge.</p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "border-[var(--brand)] bg-emerald-50 text-[var(--brand-dark)]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {tasks.map((t) => {
          const done = doneTodayKeys.has(t.key);
          return (
            <Card key={t.key} className={`flex items-start gap-4 transition-all ${done ? "opacity-70" : ""}`}>
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
                t.type === "speech" ? "bg-emerald-50" : t.type === "facial" ? "bg-violet-50" : "bg-blue-50"
              }`}>
                {ICONS[t.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${DOMAIN_COLORS[t.domain]}`}>{t.domain}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{t.difficulty}</span>
                  {done && <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--brand)]">✓ Done today</span>}
                </div>
                <div className="mt-1 text-sm text-slate-500">{t.description}</div>
                <div className="mt-1.5 text-xs text-slate-400">
                  ⏱ {Math.round(t.durationSec / 60)} min ·{" "}
                  {t.type === "speech" ? "🎤 Speech" : t.type === "facial" ? "😊 Facial" : "🧩 Cognitive"}
                </div>
              </div>
              <Link to={`/app/tasks/${t.key}`} className="shrink-0">
                <Button variant={done ? "secondary" : "primary"} className="w-auto px-4 py-2 text-xs">
                  {done ? "Redo" : "Start"}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
