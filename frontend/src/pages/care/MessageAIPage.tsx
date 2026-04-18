import { useMemo, useRef, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { computeSummary } from "../../lib/store";

type Msg = { from: "bot" | "user"; text: string };

// Local AI that generates replies based on real store data
function generateReply(message: string, summary: ReturnType<typeof computeSummary>): string {
  const q = message.toLowerCase();

  if (q.includes("score") || q.includes("cognitive")) {
    return `The patient's current cognitive score is ${summary.cognitiveScore}/100 with a ${summary.riskLevel.toLowerCase()} risk level (risk score: ${summary.riskScore}). ${
      summary.cognitiveScore >= 70
        ? "Scores are within healthy range."
        : "This is below the recommended baseline of 70. Consider increasing task frequency."
    }`;
  }
  if (q.includes("speech") || q.includes("talk") || q.includes("voice")) {
    return `Latest speech analysis shows: fluency score ${summary.speech.fluencyScore}/100, speech rate ${summary.speech.speechRateWpm} wpm, word recall: ${summary.speech.wordRecall}, pause frequency: ${summary.speech.pauseFreqPerMin}/min. ${
      summary.speech.pauseFreqPerMin > 4 ? "Elevated pause frequency may suggest word-finding difficulty." : "Speech patterns appear stable."
    }`;
  }
  if (q.includes("facial") || q.includes("emotion") || q.includes("expression")) {
    return `Facial analysis: stress level is ${summary.facial.stress}, emotional state: ${summary.facial.emotionalState}, engagement: ${summary.facial.engagement}. ${
      summary.facial.stress === "High" ? "High stress detected — recommend relaxation activities before sessions." : "Emotional indicators look positive."
    }`;
  }
  if (q.includes("memory") || q.includes("remember")) {
    return `Memory retention is at ${summary.cognitive.memoryRetentionPct}%. ${
      summary.cognitive.memoryRetentionPct >= 70
        ? "Memory performance is good."
        : "Below average. The Memory Sequence task should be prioritized in the daily plan."
    } Pattern recognition stands at ${summary.cognitive.patternRecognitionPct}%.`;
  }
  if (q.includes("reaction") || q.includes("speed") || q.includes("fast")) {
    return `Current reaction time is ${summary.cognitive.reactionTimeMs}ms. ${
      summary.cognitive.reactionTimeMs < 400 ? "This is excellent — above average cognitive processing speed." : summary.cognitive.reactionTimeMs < 700 ? "Within normal range." : "Slower than baseline. The Reaction Time Test can help improve this."
    }`;
  }
  if (q.includes("risk")) {
    return `Risk classification is currently: ${summary.riskLevel} (${summary.riskScore}/100). ${
      summary.riskLevel === "High"
        ? "High risk warrants clinical attention. Recommend scheduling a formal cognitive assessment."
        : summary.riskLevel === "Moderate"
        ? "Moderate risk. Monitor trends weekly and ensure 5 tasks are completed per day."
        : "Low risk — patient is doing well. Maintain current regimen."
    }`;
  }
  if (q.includes("plan") || q.includes("recommend") || q.includes("suggest") || q.includes("next")) {
    return `Based on current scores (cognitive: ${summary.cognitiveScore}, risk: ${summary.riskLevel}), I recommend:\n1. Prioritize the Stroop Color Test and Memory Sequence for attention training.\n2. Add speech analysis sessions 3x/week.\n3. ${summary.riskLevel === "High" ? "Schedule a clinical consultation this week." : "Continue current daily task schedule."}`;
  }
  if (q.includes("trend") || q.includes("week") || q.includes("progress")) {
    const vals = summary.trend.last7Days;
    const hasData = vals.some((v) => v > 0);
    if (!hasData) return "No trend data available yet. The patient needs to complete more tasks across multiple days.";
    const avg = Math.round(vals.filter((v) => v > 0).reduce((a, b) => a + b, 0) / vals.filter((v) => v > 0).length);
    return `7-day trend data shows an average score of ${avg}. The most recent session scored ${vals[6] || "N/A"}. ${
      vals[6] > vals[0] ? "Scores are trending upward — positive progress." : "Scores are steady this week."
    }`;
  }

  // Default
  return `I can help you understand this patient's cognitive health data. You can ask me about: cognitive scores, speech analysis, facial expression results, memory, reaction time, risk level, weekly trends, or care recommendations. What would you like to know?`;
}

export function MessageAIPage() {
  const summary = useMemo(() => computeSummary(), []);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: `Hello! I'm Cogniscan AI, your cognitive health assistant. I have access to this patient's local session data. Current cognitive score: ${computeSummary().cognitiveScore}/100, Risk: ${computeSummary().riskLevel}. How can I help you today?` },
  ]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function sendMessage() {
    const msg = input.trim();
    if (!msg) return;
    setMsgs((m) => [...m, { from: "user", text: msg }]);
    setInput("");
    setThinking(true);

    // Simulate local AI "thinking" delay
    setTimeout(() => {
      const reply = generateReply(msg, summary);
      setMsgs((m) => [...m, { from: "bot", text: reply }]);
      setThinking(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 600 + Math.random() * 400);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Message AI assistant</h2>
        <p className="text-sm text-slate-500">Ask about patient status, trends, and care recommendations.</p>
      </div>

      <Card className="min-h-[340px] flex flex-col">
        <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                m.from === "bot"
                  ? "bg-slate-50 text-slate-700"
                  : "ml-8 bg-emerald-50 text-emerald-900"
              }`}
            >
              {m.from === "bot" && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)] block mb-1">
                  Cogniscan AI
                </span>
              )}
              {m.text}
            </div>
          ))}

          {thinking && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <input
            id="ai-message-input"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-emerald-100"
            placeholder="Ask about the patient…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !thinking && input.trim()) sendMessage();
            }}
            disabled={thinking}
          />
          <Button
            variant="primary"
            className="w-auto px-4 py-2.5 text-sm"
            onClick={sendMessage}
            disabled={thinking || !input.trim()}
          >
            {thinking ? "…" : "Send"}
          </Button>
        </div>
      </Card>

      {/* Quick suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {["What's the cognitive score?", "Explain the risk level", "Speech analysis summary", "Weekly trend"].map(
          (chip) => (
            <button
              key={chip}
              onClick={() => { setInput(chip); }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:border-[var(--brand)] transition-colors"
            >
              {chip}
            </button>
          )
        )}
      </div>
    </div>
  );
}
