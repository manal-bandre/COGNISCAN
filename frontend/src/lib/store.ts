// ─── Local App Store ──────────────────────────────────────────────────────────
// All data lives in localStorage so it persists across page refreshes.
// This replaces all backend API calls, making the app fully self-contained.

export interface SessionResult {
  taskKey: string;
  type: "cognitive" | "speech" | "facial";
  completedAt: string;
  scoreBreakdown: {
    speechRate?: number;
    fluency?: number;
    wordRecall?: number;
    pauseFreq?: number;
    stress?: number;
    engagement?: number;
    emotionalState?: string;
    reactionTimeMs?: number;
    memoryRetention?: number;
    patternRecognition?: number;
    decisionMaking?: number;
  };
  overallScore: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Results ─────────────────────────────────────────────────────────────────
export function getResults(): SessionResult[] {
  return read<SessionResult[]>("cog_results", []);
}

export function saveResult(r: SessionResult) {
  const all = getResults();
  write("cog_results", [r, ...all].slice(0, 50)); // keep last 50
}

// ─── Derived summary ──────────────────────────────────────────────────────────
export function computeSummary() {
  const results = getResults();
  if (results.length === 0) {
    return {
      cognitiveScore: 72,
      riskScore: 28,
      riskLevel: "Low" as const,
      trend: { last7Days: [54, 60, 58, 65, 70, 68, 72] },
      speech: { speechRateWpm: 112, pauseFreqPerMin: 3.2, wordRecall: "Moderate", fluencyScore: 68 },
      facial: { stress: "Low", emotionalState: "Calm", microExpressions: "Neutral", engagement: "High" },
      cognitive: { reactionTimeMs: 420, memoryRetentionPct: 72, patternRecognitionPct: 68, decisionMakingPct: 75 },
    };
  }

  const speechResults = results.filter((r) => r.type === "speech");
  const facialResults = results.filter((r) => r.type === "facial");
  const cogResults = results.filter((r) => r.type === "cognitive");

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const cogScore = avg(results.slice(0, 10).map((r) => r.overallScore));
  const riskScore = Math.max(0, 100 - cogScore);
  const riskLevel = riskScore < 30 ? "Low" : riskScore < 60 ? "Moderate" : "High";

  // Last 7 days trend
  const now = Date.now();
  const last7: number[] = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * 86400000;
    const dayEnd = dayStart + 86400000;
    const dayResults = results.filter((r) => {
      const t = new Date(r.completedAt).getTime();
      return t >= dayStart && t < dayEnd;
    });
    return dayResults.length ? avg(dayResults.map((r) => r.overallScore)) : 0;
  });

  const latestSpeech = speechResults[0]?.scoreBreakdown;
  const latestFacial = facialResults[0]?.scoreBreakdown;
  const latestCog = cogResults[0]?.scoreBreakdown;

  return {
    cognitiveScore: cogScore || 72,
    riskScore: riskScore || 28,
    riskLevel: (riskLevel || "Low") as "Low" | "Moderate" | "High",
    trend: { last7Days: last7.every((v) => v === 0) ? [54, 60, 58, 65, 70, 68, 72] : last7 },
    speech: {
      speechRateWpm: latestSpeech?.speechRate ?? 112,
      pauseFreqPerMin: latestSpeech?.pauseFreq ?? 3.2,
      wordRecall: latestSpeech?.wordRecall ?? "Moderate",
      fluencyScore: latestSpeech?.fluency ?? 68,
    },
    facial: {
      stress: latestFacial?.stress !== undefined ? (latestFacial.stress < 40 ? "Low" : latestFacial.stress < 70 ? "Moderate" : "High") : "Low",
      emotionalState: latestFacial?.emotionalState ?? "Calm",
      microExpressions: "Neutral",
      engagement: latestFacial?.engagement !== undefined ? (latestFacial.engagement > 60 ? "High" : "Moderate") : "High",
    },
    cognitive: {
      reactionTimeMs: latestCog?.reactionTimeMs ?? 420,
      memoryRetentionPct: latestCog?.memoryRetention ?? 72,
      patternRecognitionPct: latestCog?.patternRecognition ?? 68,
      decisionMakingPct: latestCog?.decisionMaking ?? 75,
    },
  };
}

export function computeRiskBreakdown() {
  const s = computeSummary();
  return {
    breakdown: [
      { key: "speech", label: "Speech", score: s.speech.fluencyScore, range: `${s.speech.fluencyScore}/100` },
      { key: "memory", label: "Memory", score: s.cognitive.memoryRetentionPct, range: `${s.cognitive.memoryRetentionPct}%` },
      { key: "reaction", label: "Reaction", score: Math.max(0, 100 - Math.round(s.cognitive.reactionTimeMs / 10)), range: `${s.cognitive.reactionTimeMs}ms` },
      { key: "pattern", label: "Pattern", score: s.cognitive.patternRecognitionPct, range: `${s.cognitive.patternRecognitionPct}%` },
      { key: "decision", label: "Decision", score: s.cognitive.decisionMakingPct, range: `${s.cognitive.decisionMakingPct}%` },
    ],
  };
}

// ─── Task catalog ─────────────────────────────────────────────────────────────
export const TASK_CATALOG = [
  { key: "speech_read_aloud", name: "Read Aloud", domain: "Language" as const, difficulty: "Easy" as const, durationSec: 120, description: "Read a passage aloud. We analyze fluency, rate, and clarity.", type: "speech" as const },
  { key: "speech_word_recall", name: "Word Recall", domain: "Language" as const, difficulty: "Medium" as const, durationSec: 90, description: "Recall and speak as many words as possible from a given category.", type: "speech" as const },
  { key: "facial_emotion", name: "Emotion Mirroring", domain: "Motor" as const, difficulty: "Easy" as const, durationSec: 60, description: "Follow on-screen expressions while your webcam measures your facial activity.", type: "facial" as const },
  { key: "cog_reaction", name: "Reaction Time Test", domain: "Attention" as const, difficulty: "Easy" as const, durationSec: 60, description: "Tap as fast as possible when the target appears. Measures cognitive speed.", type: "cognitive" as const },
  { key: "cog_memory_sequence", name: "Memory Sequence", domain: "Memory" as const, difficulty: "Medium" as const, durationSec: 120, description: "Memorize and repeat a sequence of colored tiles.", type: "cognitive" as const },
  { key: "cog_pattern", name: "Pattern Recognition", domain: "Attention" as const, difficulty: "Hard" as const, durationSec: 90, description: "Identify the odd pattern in a grid as quickly as possible.", type: "cognitive" as const },
  { key: "cog_stroop", name: "Stroop Color Test", domain: "Attention" as const, difficulty: "Hard" as const, durationSec: 90, description: "Name the ink color of words — tests inhibition and processing speed.", type: "cognitive" as const },
];

export function computeStreak(): number {
  const results = getResults();
  if (results.length === 0) return 0;

  // Build a set of unique ISO date strings (YYYY-MM-DD) with at least one result
  const daySet = new Set(
    results.map((r) => r.completedAt.slice(0, 10))
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
    } else if (i > 0) {
      // Allow today to still count even without a session
      break;
    }
  }
  return streak;
}

export function getTodayTasks() {
  const results = getResults();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const doneTodayKeys = new Set(
    results
      .filter((r) => new Date(r.completedAt) >= todayStart)
      .map((r) => r.taskKey)
  );

  const daily = TASK_CATALOG.slice(0, 5);
  return {
    date: todayStart.toISOString(),
    tasks: daily.map((t) => ({ ...t, status: doneTodayKeys.has(t.key) ? ("done" as const) : ("pending" as const) })),
  };
}

export function getReports() {
  const results = getResults();
  if (results.length === 0) {
    return {
      reports: [
        { id: "r1", weekStart: "2026-04-07", weekEnd: "2026-04-13", cognitiveScore: 71, riskScore: 29, tasksCompleted: 14, tasksAssigned: 15 },
        { id: "r2", weekStart: "2026-04-14", weekEnd: "2026-04-18", cognitiveScore: 74, riskScore: 26, tasksCompleted: 11, tasksAssigned: 12 },
      ],
    };
  }
  const summary = computeSummary();
  return {
    reports: [
      {
        id: "current",
        weekStart: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        weekEnd: new Date().toISOString().slice(0, 10),
        cognitiveScore: summary.cognitiveScore,
        riskScore: summary.riskScore,
        tasksCompleted: results.filter((r) => new Date(r.completedAt).getTime() > Date.now() - 7 * 86400000).length,
        tasksAssigned: 10,
      },
    ],
  };
}
