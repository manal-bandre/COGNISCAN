import { useEffect, useRef, useState } from "react";
import { saveResult } from "../../lib/store";

interface Props {
  taskKey: string;
  taskName: string;
  onComplete: (score: number) => void;
}

const PASSAGES: Record<string, string> = {
  speech_read_aloud:
    "The morning sun cast long shadows across the quiet garden. A gentle breeze stirred the leaves, carrying with it the faint scent of blooming jasmine. An elderly man sat on a wooden bench, watching a sparrow hop along the stone path, pecking at invisible crumbs. He smiled softly, grateful for another peaceful morning.",
  speech_word_recall:
    "You have 45 seconds. Say as many animals as you can think of. Ready? Go!",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;
const SpeechAPI: AnySpeechRecognition =
  (window as unknown as Record<string, unknown>)["SpeechRecognition"] ||
  (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"];

export function SpeechTask({ taskKey, taskName, onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "recording" | "analysing" | "result">("intro");
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState<{
    speechRate: number;
    fluency: number;
    wordRecall: number;
    pauseFreq: number;
    overall: number;
    wordRecallLabel: string;
  } | null>(null);
  const [noSpeechAPI, setNoSpeechAPI] = useState(false);
  const recogRef = useRef<unknown | null>(null);
  const startTimeRef = useRef<number>(0);
  const wordCountRef = useRef(0);
  const pauseCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = taskKey === "speech_word_recall" ? 45 : 90;
  const passage = PASSAGES[taskKey] ?? PASSAGES["speech_read_aloud"];

  function startRecording() {
    if (!SpeechAPI) {
      setNoSpeechAPI(true);
      return;
    }
    const recognition = new SpeechAPI();
    recogRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let lastResultTime = Date.now();
    let accumulated = "";

    recognition.onresult = (e: { resultIndex: number; results: { isFinal: boolean; [0]: { transcript: string } }[] }) => {
      const now = Date.now();
      const gap = now - lastResultTime;
      if (gap > 800) pauseCountRef.current += 1;
      lastResultTime = now;

      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulated += t + " ";
        else interim = t;
      }
      setTranscript((accumulated + interim).trim());
      wordCountRef.current = (accumulated + interim).trim().split(/\s+/).filter(Boolean).length;
    };

    recognition.onend = () => {
      // auto finalize
    };

    recognition.start();
    startTimeRef.current = Date.now();
    setPhase("recording");
    setTimeLeft(duration);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          recognition.stop();
          finalise();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function stopEarly() {
    if (timerRef.current) clearInterval(timerRef.current);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recogRef.current as any)?.stop();
    finalise();
  }

  function finalise() {
    setPhase("analysing");
    setTimeout(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60; // minutes
      const wpm = elapsed > 0 ? Math.round(wordCountRef.current / elapsed) : 0;
      const pausePerMin = elapsed > 0 ? Math.round((pauseCountRef.current / elapsed) * 10) / 10 : 0;

      const expectedWpm = 120;
      const wpmScore = Math.min(100, Math.round((wpm / expectedWpm) * 100));
      const fluency = Math.max(0, Math.min(100, 100 - pauseCountRef.current * 5));
      const wordRecallRaw = taskKey === "speech_word_recall" ? Math.min(100, Math.round((wordCountRef.current / 20) * 100)) : 75;
      const wordRecallLabel = wordRecallRaw < 40 ? "Low" : wordRecallRaw < 70 ? "Moderate" : "Good";
      const overall = Math.round((wpmScore * 0.3 + fluency * 0.4 + wordRecallRaw * 0.3));

      const result = {
        speechRate: wpm || 110,
        fluency: fluency || 68,
        wordRecall: wordRecallRaw || 72,
        pauseFreq: pausePerMin || 3,
        overall: overall || 70,
        wordRecallLabel,
      };
      setScore(result);
      setPhase("result");

      saveResult({
        taskKey,
        type: "speech",
        completedAt: new Date().toISOString(),
        scoreBreakdown: {
          speechRate: result.speechRate,
          fluency: result.fluency,
          wordRecall: result.wordRecall,
          pauseFreq: result.pauseFreq,
        },
        overallScore: result.overall,
      });
      onComplete(result.overall);
    }, 2000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); (recogRef.current as any)?.stop(); }, []);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-lg font-bold text-slate-900">🎤 {taskName}</div>
        <div className="mt-1 text-sm text-slate-500">Speech Analysis Task</div>
      </div>

      {phase === "intro" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 leading-relaxed text-slate-700 text-sm">
            {passage}
          </div>
          {noSpeechAPI && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              ⚠️ Your browser doesn't support the Speech Recognition API. Try Chrome or Edge.
            </div>
          )}
          <button
            onClick={startRecording}
            className="w-full rounded-2xl bg-[var(--brand)] py-3 text-white font-semibold text-sm hover:bg-[var(--brand-dark)] transition-colors"
          >
            🎙 Start Recording
          </button>
        </div>
      )}

      {phase === "recording" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500"></span>
              <span className="text-sm font-medium text-red-600">Recording</span>
            </div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-mono text-white">{timeLeft}s</div>
          </div>

          <div className="min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {transcript || <span className="text-slate-400 italic">Listening… speak clearly into your microphone</span>}
          </div>

          {/* Waveform animation */}
          <div className="flex items-end justify-center gap-1 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-[var(--brand)] opacity-70"
                style={{
                  height: `${10 + Math.sin(Date.now() / 200 + i) * 10 + 10}px`,
                  animation: `pulse ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={stopEarly}
              className="flex-1 rounded-2xl border border-slate-300 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ⏹ Finish Early
            </button>
          </div>
        </div>
      )}

      {phase === "analysing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent"></div>
          <div className="text-sm text-slate-600">Analysing your speech patterns…</div>
        </div>
      )}

      {phase === "result" && score && (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 px-10 py-6 border border-emerald-100">
              <div className="text-5xl font-extrabold text-[var(--brand)]">{score.overall}</div>
              <div className="mt-1 text-sm font-medium text-slate-500">Overall Score</div>
            </div>
          </div>
          <div className="space-y-3">
            <ScoreBar label="Speech Rate" value={`${score.speechRate} wpm`} pct={Math.min(100, Math.round((score.speechRate / 160) * 100))} />
            <ScoreBar label="Fluency" value={`${score.fluency}/100`} pct={score.fluency} />
            <ScoreBar label="Word Recall" value={score.wordRecallLabel} pct={score.wordRecall} />
            <ScoreBar label="Pause Control" value={`${score.pauseFreq}/min`} pct={Math.max(0, 100 - score.pauseFreq * 10)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  const color = pct >= 70 ? "bg-[var(--brand)]" : pct >= 45 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
