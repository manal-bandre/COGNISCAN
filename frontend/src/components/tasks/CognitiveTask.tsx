import { useCallback, useEffect, useRef, useState } from "react";
import { saveResult } from "../../lib/store";

interface Props {
  taskKey: string;
  taskName: string;
  onComplete: (score: number) => void;
}

// ─── Reaction Time ────────────────────────────────────────────────────────────
function ReactionTask({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<"wait" | "ready" | "now" | "hit" | "done">("wait");
  const [times, setTimes] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);
  const ROUNDS = 5;

  const scheduleNext = useCallback(() => {
    setPhase("ready");
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("now");
    }, delay);
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  function handleTap() {
    if (phase === "ready") {
      // Too early — penalty
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("hit");
      setTimes((t) => [...t, 999]);
      proceed();
    } else if (phase === "now") {
      const rt = Math.round(performance.now() - startRef.current);
      setTimes((t) => [...t, rt]);
      setPhase("hit");
      proceed();
    }
  }

  function proceed() {
    const nextRound = round + 1;
    setRound(nextRound);
    if (nextRound >= ROUNDS) {
      setTimeout(() => setPhase("done"), 600);
      return;
    }
    setTimeout(() => scheduleNext(), 1000);
  }

  useEffect(() => {
    if (phase === "done" && times.length === ROUNDS) {
      const valid = times.filter((t) => t < 999);
      const avg = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 800;
      // Score: <200ms=100, >1000ms=0
      const score = Math.max(0, Math.min(100, Math.round(100 - (avg - 200) / 8)));
      onComplete(score);
      saveResult({
        taskKey: "cog_reaction",
        type: "cognitive",
        completedAt: new Date().toISOString(),
        scoreBreakdown: { reactionTimeMs: avg },
        overallScore: score,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, times]);

  const bgColor = phase === "now" ? "bg-[var(--brand)]" : phase === "ready" ? "bg-slate-200" : phase === "hit" ? "bg-blue-400" : "bg-slate-100";
  const label = phase === "wait" ? "Get ready…" : phase === "ready" ? "Wait for green…" : phase === "now" ? "TAP NOW! 🟢" : phase === "hit" ? "✓ Good!" : "Done!";

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-slate-500">Round {Math.min(round + 1, ROUNDS)} / {ROUNDS}</p>
        <div className="mt-2 flex justify-center gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div key={i} className={`h-2 w-6 rounded-full ${i < round ? "bg-[var(--brand)]" : "bg-slate-200"}`} />
          ))}
        </div>
      </div>

      <button
        onClick={handleTap}
        className={`w-full h-48 rounded-3xl text-2xl font-bold text-white transition-all duration-150 select-none ${bgColor} ${phase === "now" ? "scale-105 shadow-2xl shadow-[var(--brand)]/20" : ""}`}
      >
        {label}
        {times.length > 0 && phase === "hit" && (
          <div className="mt-2 text-base font-normal opacity-80">
            {times[times.length - 1] < 999 ? `${times[times.length - 1]}ms` : "Too early!"}
          </div>
        )}
      </button>

      {times.filter((t) => t < 999).length > 0 && (
        <div className="text-center text-xs text-slate-400">
          Avg so far: {Math.round(times.filter((t) => t < 999).reduce((a, b) => a + b, 0) / times.filter((t) => t < 999).length)}ms
        </div>
      )}
    </div>
  );
}

// ─── Memory Sequence ──────────────────────────────────────────────────────────
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
const COLOR_NAMES = ["Red", "Blue", "Green", "Yellow", "Purple"];

function MemoryTask({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<"intro" | "show" | "answer" | "feedback" | "done">("intro");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  function startLevel(lvl: number) {
    const len = 2 + lvl;
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * COLORS.length));
    setSequence(seq);
    setUserSeq([]);
    setPhase("show");

    // Flash the sequence
    let i = 0;
    const flash = () => {
      if (i >= seq.length) {
        setTimeout(() => { setActiveIdx(null); setPhase("answer"); }, 600);
        return;
      }
      setActiveIdx(seq[i]);
      i++;
      setTimeout(() => { setActiveIdx(null); setTimeout(flash, 400); }, 600);
    };
    setTimeout(flash, 600);
  }

  function handleColorTap(colorIdx: number) {
    if (phase !== "answer") return;
    const newUserSeq = [...userSeq, colorIdx];
    setUserSeq(newUserSeq);

    if (newUserSeq[newUserSeq.length - 1] !== sequence[newUserSeq.length - 1]) {
      // Wrong
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setPhase("done");
        const s = Math.min(100, Math.round((score / (level * 3)) * 100));
        onComplete(s);
        saveResult({
          taskKey: "cog_memory_sequence",
          type: "cognitive",
          completedAt: new Date().toISOString(),
          scoreBreakdown: { memoryRetention: s },
          overallScore: s,
        });
      } else {
        setFeedbackMsg("❌ Wrong — try again!");
        setPhase("feedback");
        setTimeout(() => startLevel(level), 1500);
      }
      return;
    }

    if (newUserSeq.length === sequence.length) {
      // Correct!
      const pts = sequence.length * 10;
      setScore((s) => s + pts);
      const nextLevel = level + 1;
      if (nextLevel > 6) {
        setPhase("done");
        const finalScore = 100;
        onComplete(finalScore);
        saveResult({
          taskKey: "cog_memory_sequence",
          type: "cognitive",
          completedAt: new Date().toISOString(),
          scoreBreakdown: { memoryRetention: finalScore },
          overallScore: finalScore,
        });
      } else {
        setFeedbackMsg("✅ Correct! Next level…");
        setPhase("feedback");
        setLevel(nextLevel);
        setTimeout(() => startLevel(nextLevel), 1200);
      }
    }
  }

  return (
    <div className="space-y-5">
      {phase === "intro" && (
        <div className="space-y-4 text-center">
          <p className="text-slate-600 text-sm">Watch the color sequence light up, then repeat it in the same order. Starts easy, gets harder!</p>
          <div className="flex justify-center gap-3 my-4">
            {COLORS.map((c) => (
              <div key={c} className="h-10 w-10 rounded-full shadow" style={{ background: c }} />
            ))}
          </div>
          <button
            onClick={() => startLevel(1)}
            className="w-full rounded-2xl bg-blue-600 py-3 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            ▶ Start Sequence
          </button>
        </div>
      )}

      {(phase === "show" || phase === "answer" || phase === "feedback") && (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Level {level}</span>
            <span className="text-slate-500">{Array.from({ length: lives }).map(() => "❤️").join("")}</span>
            <span className="font-mono text-[var(--brand)]">Score: {score}</span>
          </div>
          <div className="text-center text-xs text-slate-400">
            {phase === "show" ? "🔵 Watch the sequence…" : phase === "feedback" ? feedbackMsg : "👆 Repeat the sequence"}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {COLORS.map((c, i) => (
              <button
                key={c}
                onClick={() => handleColorTap(i)}
                className={`h-16 w-full rounded-2xl shadow-md transition-all duration-150 ${activeIdx === i ? "scale-110 brightness-150 shadow-xl" : "hover:scale-105"}`}
                style={{ background: c, opacity: phase === "show" && activeIdx !== i ? 0.4 : 1 }}
                title={COLOR_NAMES[i]}
                disabled={phase !== "answer"}
              />
            ))}
          </div>
          <div className="flex justify-center gap-1 mt-2">
            {sequence.map((_, i) => (
              <div key={i} className={`h-2 w-5 rounded-full ${i < userSeq.length ? "bg-blue-400" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-2 py-4">
          <div className="text-4xl font-extrabold text-blue-600">{score}</div>
          <div className="text-sm text-slate-500">Points scored · Level {level}</div>
        </div>
      )}
    </div>
  );
}

// ─── Pattern Recognition ──────────────────────────────────────────────────────
const SHAPES = ["⬛", "⬜", "🔷", "🔶", "🔴"];

function PatternTask({ onComplete }: { onComplete: (score: number) => void }) {
  const [q, setQ] = useState(0);
  const [grid, setGrid] = useState<number[]>([]);
  const [oddIdx, setOddIdx] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const startRef = useRef(performance.now());
  const TOTAL = 6;

  const genQuestion = useCallback(() => {
    const size = 9;
    const base = Math.floor(Math.random() * SHAPES.length);
    const g = Array(size).fill(base);
    const odd = Math.floor(Math.random() * size);
    let oddShape = Math.floor(Math.random() * SHAPES.length);
    while (oddShape === base) oddShape = Math.floor(Math.random() * SHAPES.length);
    g[odd] = oddShape;
    setGrid(g);
    setOddIdx(odd);
    setFeedback(null);
    startRef.current = performance.now();
  }, []);

  useEffect(() => { genQuestion(); }, [genQuestion]);

  function handlePick(i: number) {
    const rt = Math.round(performance.now() - startRef.current);
    setTimes((t) => [...t, rt]);
    const isCorrect = i === oddIdx;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      const nextQ = q + 1;
      setQ(nextQ);
      if (nextQ >= TOTAL) {
        const pct = Math.round((correct + (isCorrect ? 1 : 0)) / TOTAL * 100);
        const avgRt = times.length ? Math.round([...times, rt].reduce((a, b) => a + b, 0) / (times.length + 1)) : 600;
        const speedBonus = Math.max(0, Math.round(30 - (avgRt - 500) / 50));
        const final = Math.min(100, pct + speedBonus);
        onComplete(final);
        saveResult({
          taskKey: "cog_pattern",
          type: "cognitive",
          completedAt: new Date().toISOString(),
          scoreBreakdown: { patternRecognition: pct, reactionTimeMs: avgRt },
          overallScore: final,
        });
      } else {
        genQuestion();
      }
    }, 800);
  }

  if (q >= TOTAL) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Question {q + 1}/{TOTAL}</span>
        <span className="font-semibold text-[var(--brand)]">✅ {correct} correct</span>
      </div>
      <p className="text-center text-sm text-slate-600">Find the one that's <strong>different</strong>!</p>
      <div className="grid grid-cols-3 gap-3">
        {grid.map((shapeIdx, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={feedback !== null}
            className={`h-20 rounded-2xl border-2 text-4xl transition-all duration-150 hover:scale-105 ${
              feedback !== null && i === oddIdx
                ? "border-[var(--brand)] bg-emerald-50"
                : feedback === "wrong" && i === grid.findIndex((_, fi) => fi !== oddIdx && grid[fi] !== grid[oddIdx])
                ? "border-red-400 bg-red-50"
                : "border-slate-200 bg-white hover:border-slate-400"
            }`}
          >
            {SHAPES[shapeIdx]}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`text-center text-sm font-semibold ${feedback === "correct" ? "text-[var(--brand)]" : "text-red-600"}`}>
          {feedback === "correct" ? "✅ Correct!" : "❌ Wrong!"}
        </p>
      )}
    </div>
  );
}

// ─── Stroop Test ──────────────────────────────────────────────────────────────
const STROOP_COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#ca8a04" },
];

function StroopTask({ onComplete }: { onComplete: (score: number) => void }) {
  const [q, setQ] = useState(0);
  const [word, setWord] = useState("");
  const [inkColorIdx, setInkColorIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const startRef = useRef(performance.now());
  const TOTAL = 8;

  const genQ = useCallback(() => {
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    // ~60% incongruent
    if (Math.random() > 0.4) while (inkIdx === wordIdx) inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    setWord(STROOP_COLORS[wordIdx].name);
    setInkColorIdx(inkIdx);
    setFeedback(null);
    startRef.current = performance.now();
  }, []);

  useEffect(() => { genQ(); }, [genQ]);

  function pick(idx: number) {
    const rt = Math.round(performance.now() - startRef.current);
    setTimes((t) => [...t, rt]);
    const isCorrect = idx === inkColorIdx;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      const nextQ = q + 1;
      setQ(nextQ);
      if (nextQ >= TOTAL) {
        const pct = Math.round((correct + (isCorrect ? 1 : 0)) / TOTAL * 100);
        const avgRt = times.length ? Math.round([...times, rt].reduce((a, b) => a + b, 0) / (times.length + 1)) : 1000;
        const speedBonus = Math.max(0, Math.round(20 - (avgRt - 800) / 50));
        const final = Math.min(100, pct + speedBonus);
        onComplete(final);
        saveResult({
          taskKey: "cog_stroop",
          type: "cognitive",
          completedAt: new Date().toISOString(),
          scoreBreakdown: { decisionMaking: pct, reactionTimeMs: avgRt },
          overallScore: final,
        });
      } else {
        genQ();
      }
    }, 700);
  }

  if (q >= TOTAL) return null;

  return (
    <div className="space-y-5">
      <div className="flex justify-between text-sm text-slate-500">
        <span>Q {q + 1}/{TOTAL}</span>
        <span className="font-semibold text-[var(--brand)]">✅ {correct}</span>
      </div>
      <p className="text-center text-xs text-slate-500 mb-1">Name the <strong>ink color</strong>, ignore the word!</p>
      <div className="flex items-center justify-center h-24">
        <span className="text-5xl font-extrabold" style={{ color: STROOP_COLORS[inkColorIdx].hex }}>
          {word}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {STROOP_COLORS.map((c, i) => (
          <button
            key={c.name}
            onClick={() => pick(i)}
            disabled={feedback !== null}
            className={`h-14 rounded-2xl border-2 text-sm font-bold transition-all hover:scale-105 ${
              feedback !== null && i === inkColorIdx ? "border-[var(--brand)] bg-emerald-50" : "border-slate-200 bg-white"
            }`}
            style={{ color: c.hex }}
          >
            {c.name}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`text-center text-sm font-semibold ${feedback === "correct" ? "text-[var(--brand)]" : "text-red-600"}`}>
          {feedback === "correct" ? "✅ Correct!" : `❌ It was ${STROOP_COLORS[inkColorIdx].name}`}
        </p>
      )}
    </div>
  );
}

// ─── Main CognitiveTask router ────────────────────────────────────────────────
export function CognitiveTask({ taskKey, taskName: _taskName, onComplete }: Props) {
  if (taskKey === "cog_reaction") return <ReactionTask onComplete={onComplete} />;
  if (taskKey === "cog_memory_sequence") return <MemoryTask onComplete={onComplete} />;
  if (taskKey === "cog_pattern") return <PatternTask onComplete={onComplete} />;
  if (taskKey === "cog_stroop") return <StroopTask onComplete={onComplete} />;

  return (
    <div className="text-center text-sm text-slate-500 py-8">
      Unknown task key: {taskKey}
    </div>
  );
}
