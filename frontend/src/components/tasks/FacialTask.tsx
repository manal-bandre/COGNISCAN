import { useEffect, useRef, useState } from "react";
import { saveResult } from "../../lib/store";

interface Props {
  taskKey: string;
  taskName: string;
  onComplete: (score: number) => void;
}

const EXPRESSIONS = [
  { label: "Happy", emoji: "😊", instruction: "Smile broadly — show your teeth!", color: "#f59e0b" },
  { label: "Surprised", emoji: "😮", instruction: "Open your eyes and mouth wide.", color: "#6366f1" },
  { label: "Angry", emoji: "😠", instruction: "Furrow your brows, tighten your lips.", color: "#ef4444" },
  { label: "Sad", emoji: "😢", instruction: "Turn the corners of your mouth downward.", color: "#64748b" },
  { label: "Neutral", emoji: "😐", instruction: "Relax your face completely — go blank.", color: "#1d9e75" },
];

export function FacialTask({ taskKey, taskName, onComplete }: Props) {
  // Always render video element so ref is attached before stream starts
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<"intro" | "camera" | "expressions" | "analysing" | "result">("intro");
  const [camError, setCamError] = useState<string | null>(null);
  const [currentExprIdx, setCurrentExprIdx] = useState(0);
  const [exprTimeLeft, setExprTimeLeft] = useState(5);
  const [motionScores, setMotionScores] = useState<number[]>([]);
  const [result, setResult] = useState<{
    stress: number;
    engagement: number;
    emotionalState: string;
    overall: number;
  } | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);

  async function startCamera() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      // Ensure the video element exists in the DOM before setting srcObject
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {
            // autoplay blocked — user must interact
          });
        };
      }

      setPhase("camera");
    } catch (err) {
      const e = err as { name?: string };
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setCamError("Camera permission denied. Please allow camera access in your browser and try again.");
      } else if (e?.name === "NotFoundError") {
        setCamError("No camera found. Please connect a webcam and try again.");
      } else {
        setCamError("Could not access camera. Make sure it is not in use by another app.");
      }
    }
  }

  function startExpressions() {
    setPhase("expressions");
    setCurrentExprIdx(0);
    setExprTimeLeft(5);
  }

  function captureFrame() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 160, 120);
    const frame = ctx.getImageData(0, 0, 160, 120);

    if (prevFrameRef.current) {
      let diff = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        diff += Math.abs(frame.data[i] - prevFrameRef.current.data[i]);
      }
      const motionScore = Math.min(100, Math.round(diff / 1000));
      setMotionScores((s) => [...s, motionScore]);
    }
    prevFrameRef.current = frame;
  }

  useEffect(() => {
    if (phase !== "expressions") return;

    captureIntervalRef.current = setInterval(captureFrame, 200);

    const exprTimer = setInterval(() => {
      setExprTimeLeft((t) => {
        if (t <= 1) {
          setCurrentExprIdx((idx) => {
            const next = idx + 1;
            if (next >= EXPRESSIONS.length) {
              clearInterval(exprTimer);
              clearInterval(captureIntervalRef.current!);
              analyse();
              return idx;
            }
            return next;
          });
          return 5;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(exprTimer);
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function analyse() {
    setPhase("analysing");
    setTimeout(() => {
      const avgMotion = motionScores.length
        ? Math.round(motionScores.reduce((a, b) => a + b, 0) / motionScores.length)
        : 40;

      const engagement = Math.min(100, Math.max(10, avgMotion * 2));
      const stress = Math.max(0, Math.min(100, 100 - engagement));
      const emotionalState = engagement > 70 ? "Engaged" : engagement > 40 ? "Calm" : "Low energy";
      const overall = Math.round(engagement * 0.6 + (100 - stress) * 0.4);

      setResult({ stress, engagement, emotionalState, overall });
      setPhase("result");

      saveResult({
        taskKey,
        type: "facial",
        completedAt: new Date().toISOString(),
        scoreBreakdown: { stress, engagement, emotionalState },
        overallScore: overall,
      });

      streamRef.current?.getTracks().forEach((t) => t.stop());
      onComplete(overall);
    }, 2500);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, []);

  const expr = EXPRESSIONS[currentExprIdx];
  const showVideo = phase === "camera" || phase === "expressions";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>😊</span>
          {taskName}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Facial expression tracking via webcam</div>
      </div>

      {/* Always-mounted video (hidden when not active) */}
      <div style={{ display: showVideo ? "block" : "none", marginBottom: 16 }}>
        <div style={{
          position: "relative",
          background: "#0f172a",
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "16/9",
          border: "2px solid #7c3aed22",
        }}>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              display: "block",
            }}
            muted
            playsInline
            autoPlay
          />
          <canvas ref={canvasRef} width={160} height={120} style={{ display: "none" }} />

          {/* Expression overlay */}
          {phase === "expressions" && expr && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: 16,
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)",
            }}>
              <div style={{ fontSize: 64, lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))", marginBottom: 8 }}>
                {expr.emoji}
              </div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, textAlign: "center", marginBottom: 10 }}>
                {expr.instruction}
              </div>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {EXPRESSIONS.map((e, i) => (
                  <div key={i} style={{
                    height: 5,
                    width: i === currentExprIdx ? 22 : 14,
                    borderRadius: 99,
                    background: i <= currentExprIdx ? "#a78bfa" : "rgba(255,255,255,0.25)",
                    transition: "all 0.3s ease",
                  }} />
                ))}
              </div>

              {/* Countdown ring */}
              <div style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                borderRadius: 99,
                padding: "4px 14px",
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
              }}>
                {exprTimeLeft}s
              </div>
            </div>
          )}

          {/* "Camera preview" label when idle */}
          {phase === "camera" && (
            <div style={{
              position: "absolute",
              bottom: 10,
              left: 12,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 99,
              padding: "2px 10px",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
            }}>
              📷 Camera preview — position your face in frame
            </div>
          )}
        </div>

        {phase === "camera" && (
          <button
            onClick={startExpressions}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "13px 0",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#6d28d9")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#7c3aed")}
          >
            ▶ Start Expression Test
          </button>
        )}
      </div>

      {/* Intro phase */}
      {phase === "intro" && (
        <div>
          {/* Expression previews */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            {EXPRESSIONS.map((e) => (
              <div key={e.label} style={{ textAlign: "center" }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: e.color + "15",
                  border: `1.5px solid ${e.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 4,
                }}>
                  {e.emoji}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{e.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: "#faf5ff",
            border: "1px solid #e9d5ff",
            borderRadius: 12,
            padding: "14px 16px",
            fontSize: 13,
            color: "#4c1d95",
            marginBottom: 16,
            lineHeight: 1.6,
          }}>
            <strong style={{ display: "block", marginBottom: 4 }}>How it works</strong>
            You'll mirror 5 expressions shown on screen while the webcam tracks your facial movement.
            Nothing is uploaded — all processing stays on your device.
          </div>

          {camError && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "#991b1b",
              marginBottom: 12,
            }}>
              ⚠️ {camError}
            </div>
          )}

          <button
            onClick={startCamera}
            style={{
              width: "100%",
              padding: "13px 0",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#6d28d9")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#7c3aed")}
          >
            <span style={{ fontSize: 16 }}>📷</span> Enable Camera
          </button>
        </div>
      )}

      {/* Analysing */}
      {phase === "analysing" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{
            width: 48,
            height: 48,
            border: "4px solid #e9d5ff",
            borderTop: "4px solid #7c3aed",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
            margin: "0 auto 16px",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Analysing your expressions…</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Calculating engagement & stress indicators</div>
        </div>
      )}

      {/* Result */}
      {phase === "result" && result && (
        <div>
          <div style={{
            background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)",
            border: "1px solid #ddd6fe",
            borderRadius: 16,
            padding: "24px 20px",
            textAlign: "center",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Engagement Score
            </div>
            <div style={{ fontSize: 60, fontWeight: 900, color: "#6d28d9", lineHeight: 1 }}>
              {result.overall}
            </div>
            <div style={{ fontSize: 12, color: "#8b5cf6", marginTop: 4 }}>out of 100</div>
          </div>

          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9" }}>
            {[
              { icon: "🧠", label: "Emotional state", value: result.emotionalState },
              { icon: "⚡", label: "Engagement", value: `${result.engagement}%` },
              { icon: "💆", label: "Stress level", value: result.stress < 30 ? "Low" : result.stress < 60 ? "Moderate" : "High" },
              { icon: "✅", label: "Expressions completed", value: `${EXPRESSIONS.length} of ${EXPRESSIONS.length}` },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
                borderBottom: i < 3 ? "1px solid #f1f5f9" : "none",
                fontSize: 13,
              }}>
                <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{row.icon}</span>{row.label}
                </span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
