// src/app/(workspace)/app/live/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Square, RefreshCw, CheckCircle, AlertTriangle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

type ScanStatus = "idle" | "connecting" | "scanning" | "stopping" | "failed" | "done";

export default function LiveScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── Timer ─────────────────────────── */
  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Camera ─────────────────────────── */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      throw new Error("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  /* ── Scan lifecycle ─────────────────── */
  const startScan = async () => {
    setStatus("connecting");
    setErrorMsg("");
    try {
      await startCamera();
      setStatus("scanning");
      startTimer();
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to start scan.");
      setStatus("failed");
    }
  };

  const stopScan = async () => {
    setStatus("stopping");
    stopTimer();
    stopCamera();
    // Brief delay for visual feedback, then show done
    setTimeout(() => setStatus("done"), 600);
  };

  const retry = () => {
    stopCamera();
    stopTimer();
    setElapsed(0);
    setErrorMsg("");
    setStatus("idle");
  };

  /* ── Cleanup on unmount ─────────────── */
  useEffect(() => {
    return () => {
      stopCamera();
      stopTimer();
    };
  }, [stopTimer]);

  /* ── Checklist items ─────────────────── */
  const checks = [
    "Position eye 20–30 cm from camera",
    "Ensure bright, even lighting",
    "Keep eye open and centered",
  ];

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: "#0e0f11" }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div>
          <h1
            className="font-display text-xl font-semibold"
            style={{ color: "#f1f0ee", fontFamily: "var(--font-display, 'Instrument Serif', serif)" }}
          >
            Live Diagnostic Workflow
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#8b8a87" }}>
            Camera-assisted eye screening
          </p>
        </div>

        {/* Timer badge — shows while scanning */}
        {status === "scanning" && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
            style={{
              background: "rgba(45,212,191,0.1)",
              border: "1px solid rgba(45,212,191,0.25)",
              color: "#2dd4bf",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#2dd4bf", boxShadow: "0 0 6px #2dd4bf", animation: "pulse 1.2s ease-in-out infinite" }}
            />
            REC {formatTime(elapsed)}
          </div>
        )}
      </div>

      {/* RGB line */}
      <div className="rgb-line w-full flex-shrink-0" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">

        {/* ── IDLE ─────────────────────────────── */}
        {status === "idle" && (
          <div className="w-full max-w-xl flex flex-col items-center gap-6">

            {/* Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              <Camera size={32} color="#2dd4bf" />
            </div>

            {/* Heading */}
            <div className="text-center">
              <h2
                className="font-display text-2xl font-semibold mb-2"
                style={{
                  color: "#f1f0ee",
                  fontFamily: "var(--font-display, 'Instrument Serif', serif)",
                }}
              >
                Live Precision Engine
              </h2>
              <p className="text-sm" style={{ color: "#8b8a87", maxWidth: "38ch", margin: "0 auto" }}>
                Automated pupil tracking and illumination correction for smartphone-based triage.
              </p>
            </div>

            {/* Checklist */}
            <div
              className="w-full rounded-xl p-4 flex flex-col gap-2.5"
              style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#4a4947" }}>
                BEFORE YOU START
              </p>
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: "#8b8a87" }}>
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2dd4bf" }} />
                  </div>
                  {c}
                </div>
              ))}
            </div>

            {/* Start button */}
            <button
              onClick={startScan}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: "#2dd4bf",
                color: "#0e0f11",
              }}
            >
              <Camera size={16} />
              Begin Scan
            </button>

            {/* Disclaimer */}
            <p className="text-xs text-center" style={{ color: "#4a4947" }}>
              AI-assisted screening guidance only. Not a substitute for a qualified eye care professional.
            </p>
          </div>
        )}

        {/* ── CONNECTING ──────────────────────── */}
        {status === "connecting" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full animate-spin"
                style={{
                  border: "2px solid transparent",
                  borderTopColor: "#2dd4bf",
                  borderRightColor: "rgba(45,212,191,0.3)",
                }}
              />
              <Camera
                size={20}
                color="#2dd4bf"
                className="absolute"
                style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
              />
            </div>
            <p className="text-sm" style={{ color: "#8b8a87" }}>
              Connecting to camera…
            </p>
          </div>
        )}

        {/* ── SCANNING ────────────────────────── */}
        {(status === "scanning" || status === "stopping") && (
          <div className="w-full max-w-2xl flex flex-col gap-4">

            {/* Camera preview */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                aspectRatio: "16/9",
                background: "#0a0b0d",
                border: "1px solid rgba(45,212,191,0.25)",
                boxShadow: "0 0 0 1px rgba(45,212,191,0.1), 0 0 40px rgba(45,212,191,0.05)",
              }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ opacity: status === "stopping" ? 0.4 : 1, transition: "opacity 400ms" }}
              />

              {/* Scan overlay — crosshair + rings */}
              {status === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Scan rings */}
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute rounded-full scan-ring"
                      style={{
                        width: 80 + i * 40,
                        height: 80 + i * 40,
                        border: "1px solid rgba(45,212,191,0.3)",
                        animationDelay: `${i * 0.66}s`,
                      }}
                    />
                  ))}
                  {/* Center crosshair */}
                  <div className="relative">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: "#2dd4bf",
                        boxShadow: "0 0 12px #2dd4bf, 0 0 24px rgba(45,212,191,0.4)",
                      }}
                    />
                    {/* Crosshair lines */}
                    <div
                      className="absolute"
                      style={{
                        width: 1, height: 20,
                        background: "rgba(45,212,191,0.5)",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -100%) translateY(-8px)",
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        width: 1, height: 20,
                        background: "rgba(45,212,191,0.5)",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, 0%) translateY(8px)",
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        height: 1, width: 20,
                        background: "rgba(45,212,191,0.5)",
                        top: "50%", left: "50%",
                        transform: "translate(-100%, -50%) translateX(-8px)",
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        height: 1, width: 20,
                        background: "rgba(45,212,191,0.5)",
                        top: "50%", left: "50%",
                        transform: "translate(0%, -50%) translateX(8px)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Corner brackets */}
              {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-5 h-5 pointer-events-none`}
                  style={{
                    borderTop: i < 2 ? "2px solid rgba(45,212,191,0.6)" : "none",
                    borderBottom: i >= 2 ? "2px solid rgba(45,212,191,0.6)" : "none",
                    borderLeft: i % 2 === 0 ? "2px solid rgba(45,212,191,0.6)" : "none",
                    borderRight: i % 2 === 1 ? "2px solid rgba(45,212,191,0.6)" : "none",
                  }}
                />
              ))}

              {/* Status indicator top-right */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(14,15,17,0.8)",
                  border: "1px solid rgba(45,212,191,0.2)",
                  color: "#2dd4bf",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#2dd4bf", animation: "pulse 1.2s ease-in-out infinite" }}
                />
                LIVE
              </div>
            </div>

            {/* Stop button */}
            <button
              onClick={stopScan}
              disabled={status === "stopping"}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
              }}
            >
              <Square size={14} />
              {status === "stopping" ? "Processing…" : "Stop Scan"}
            </button>
          </div>
        )}

        {/* ── DONE ────────────────────────────── */}
        {status === "done" && (
          <div className="w-full max-w-xl flex flex-col items-center gap-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <CheckCircle size={28} color="#22c55e" />
            </div>

            <div className="text-center">
              <h2
                className="font-display text-2xl font-semibold mb-2"
                style={{
                  color: "#f1f0ee",
                  fontFamily: "var(--font-display, 'Instrument Serif', serif)",
                }}
              >
                Scan Complete
              </h2>
              <p className="text-sm" style={{ color: "#8b8a87" }}>
                Duration: {formatTime(elapsed)} · Ready for analysis
              </p>
            </div>

            <div
              className="w-full rounded-xl p-4"
              style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <Eye size={16} color="#2dd4bf" />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#f1f0ee" }}>
                    Scan data captured
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8b8a87" }}>
                    Proceed to AI analysis or start a new session
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => router.push("/app/chat")}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{ background: "#2dd4bf", color: "#0e0f11" }}
              >
                View AI Analysis
              </button>
              <button
                onClick={retry}
                className="w-full py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8b8a87",
                }}
              >
                <RefreshCw size={14} />
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* ── FAILED ──────────────────────────── */}
        {status === "failed" && (
          <div className="w-full max-w-lg flex flex-col items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <AlertTriangle size={28} color="#ef4444" />
            </div>

            <div className="text-center">
              <h2
                className="font-display text-xl font-semibold mb-2"
                style={{
                  color: "#f1f0ee",
                  fontFamily: "var(--font-display, 'Instrument Serif', serif)",
                }}
              >
                Session failed
              </h2>
              {errorMsg && (
                <p className="text-sm" style={{ color: "#8b8a87" }}>
                  {errorMsg}
                </p>
              )}
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={retry}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f1f0ee",
                }}
              >
                <RefreshCw size={14} />
                Try again
              </button>
              <button
                onClick={() => router.push("/app/chat")}
                className="text-sm transition-colors"
                style={{ color: "#8b8a87" }}
              >
                Return to workspace
              </button>
            </div>

            <p
              className="text-xs text-center px-4 py-3 rounded-lg w-full"
              style={{
                background: "#14161a",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#8b8a87",
              }}
            >
              ⚠ AI-assisted screening guidance only. Not a substitute for a qualified eye care professional.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}