import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { computeSummary, computeRiskBreakdown } from "../../lib/store";

export function AnalysisPage() {
  const [tab, setTab] = useState<"Speech" | "Facial" | "Cognitive" | "Risk">("Speech");
  const summary = useMemo(() => computeSummary(), []);
  const breakdown = useMemo(() => computeRiskBreakdown(), []);
  const tabs: Array<typeof tab> = ["Speech", "Facial", "Cognitive", "Risk"];

  const content = useMemo(() => {
    const s = summary;
    if (tab === "Speech") {
      return (
        <Card>
          <div className="text-sm font-semibold text-slate-900">Speech analysis · Last session</div>
          <div className="mt-3 space-y-3">
            <MetricRow label="Speech rate" value={`${s.speech.speechRateWpm} wpm`} pct={Math.min(100, Math.round((s.speech.speechRateWpm / 160) * 100))} tone="emerald" />
            <MetricRow label="Pause frequency" value={`${s.speech.pauseFreqPerMin}/min`} pct={Math.max(0, 100 - Math.round(s.speech.pauseFreqPerMin * 15))} tone="amber" />
            <MetricRow label="Word recall" value={String(s.speech.wordRecall)} pct={s.speech.wordRecall === "Good" ? 80 : s.speech.wordRecall === "Moderate" ? 55 : 30} tone="amber" />
            <MetricRow label="Fluency score" value={`${s.speech.fluencyScore}/100`} pct={s.speech.fluencyScore} tone="emerald" />
          </div>
          <div className="mt-4">
            <Link to="/app/tasks/speech_read_aloud">
              <Button variant="primary">Record voice sample</Button>
            </Link>
          </div>
        </Card>
      );
    }
    if (tab === "Facial") {
      return (
        <Card>
          <div className="text-sm font-semibold text-slate-900">Facial expression analysis</div>
          <div className="mt-3 flex h-20 items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50 text-sm text-slate-500 gap-2">
            <span className="text-2xl">😊</span>
            <span>Complete the Emotion Mirroring task to see live results</span>
          </div>
          <div className="mt-3 divide-y divide-slate-100 text-sm">
            <KeyVal k="Stress level" v={s.facial.stress} tone={s.facial.stress === "Low" ? "emerald" : "amber"} />
            <KeyVal k="Emotional state" v={s.facial.emotionalState} tone="emerald" />
            <KeyVal k="Micro-expressions" v={s.facial.microExpressions} tone="emerald" />
            <KeyVal k="Engagement" v={s.facial.engagement} tone={s.facial.engagement === "High" ? "emerald" : "amber"} />
          </div>
          <div className="mt-4">
            <Link to="/app/tasks/facial_emotion">
              <Button variant="primary">Start Facial Task</Button>
            </Link>
          </div>
        </Card>
      );
    }
    if (tab === "Cognitive") {
      return (
        <Card>
          <div className="text-sm font-semibold text-slate-900">Cognitive performance</div>
          <div className="mt-3 space-y-3">
            <MetricRow
              label="Reaction time"
              value={`${s.cognitive.reactionTimeMs}ms`}
              pct={Math.max(0, Math.min(100, Math.round(100 - (s.cognitive.reactionTimeMs - 200) / 8)))}
              tone="emerald"
            />
            <MetricRow label="Memory retention" value={`${s.cognitive.memoryRetentionPct}%`} pct={s.cognitive.memoryRetentionPct} tone="emerald" />
            <MetricRow label="Pattern recognition" value={`${s.cognitive.patternRecognitionPct}%`} pct={s.cognitive.patternRecognitionPct} tone="emerald" />
            <MetricRow label="Decision making" value={`${s.cognitive.decisionMakingPct}%`} pct={s.cognitive.decisionMakingPct} tone="emerald" />
          </div>
        </Card>
      );
    }
    return (
      <Card>
        <div className="text-sm font-semibold text-slate-900">Risk score breakdown</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="text-4xl font-extrabold text-slate-900">{summary.riskScore}</div>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${
            summary.riskLevel === "Low" ? "bg-emerald-50 text-emerald-700" : summary.riskLevel === "Moderate" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"
          }`}>
            {summary.riskLevel} risk
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {breakdown.breakdown.map((b) => (
            <div key={b.key} className="flex items-center gap-3">
              <div className="w-24 text-xs text-slate-500">{b.label}</div>
              <div className="h-2 flex-1 overflow-hidden rounded bg-slate-200">
                <div className="h-full rounded bg-[var(--brand)] transition-all duration-500" style={{ width: `${b.score}%` }} />
              </div>
              <div className="w-16 text-right text-xs text-slate-600">{b.range}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }, [tab, summary, breakdown]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">AI analysis</h2>
        <p className="text-sm text-slate-500">Based on your completed tasks — all processed locally.</p>
      </div>

      {/* Cognitive score banner */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overall cognitive score</div>
            <div className="mt-1 text-4xl font-extrabold text-[var(--brand)]">{summary.cognitiveScore}/100</div>
          </div>
          <div className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
            summary.riskLevel === "Low" ? "bg-emerald-100 text-emerald-700" : summary.riskLevel === "Moderate" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          }`}>
            {summary.riskLevel} Risk
          </div>
        </div>
      </Card>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px px-3 py-2 text-sm transition-colors ${
              tab === t
                ? "border-b-2 border-[var(--brand)] font-medium text-[var(--brand)]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}

function MetricRow({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: "emerald" | "amber" }) {
  const c = tone === "emerald" ? "bg-[var(--brand)]" : "bg-amber-500";
  const tc = tone === "emerald" ? "text-[var(--brand)]" : "text-amber-700";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-500">{label}</div>
        <div className={`font-medium ${tc}`}>{value}</div>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-200">
        <div className={`h-full rounded ${c} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KeyVal({ k, v, tone }: { k: string; v: string; tone: "emerald" | "amber" }) {
  const tc = tone === "emerald" ? "text-[var(--brand)]" : "text-amber-700";
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div className="text-slate-500">{k}</div>
      <div className={`text-xs font-medium ${tc}`}>{v}</div>
    </div>
  );
}
