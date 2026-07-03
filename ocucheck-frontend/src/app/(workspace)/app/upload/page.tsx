"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session-store";
import {
  Upload, X, CheckCircle, AlertTriangle,
  Eye, FileImage, ChevronRight, RotateCcw,
  Scan, Info
} from "lucide-react";

type UploadState = "idle" | "hover" | "uploading" | "analyzing" | "done" | "error";
type TriageStatus = "normal" | "monitor" | "urgent" | "emergency";

interface AnalysisResult {
  condition: string;
  triage: TriageStatus;
  confidence: number;
  findings: string[];
  nextSteps: string[];
}

const MOCK_RESULTS: AnalysisResult = {
  condition: "Moderate Non-Proliferative Diabetic Retinopathy",
  triage: "monitor",
  confidence: 87,
  findings: [
    "Microaneurysms detected in the posterior pole",
    "Hard exudates present near the macula",
    "Mild dot and blot hemorrhages observed",
    "No evidence of neovascularization",
  ],
  nextSteps: [
    "Ophthalmologist referral within 3–6 months",
    "HbA1c optimization recommended",
    "Blood pressure monitoring",
    "Follow-up imaging in 6 months",
  ],
};

const triageConfig = {
  normal:    { label: "NORMAL",    color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  monitor:   { label: "MONITOR",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  urgent:    { label: "URGENT",    color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)" },
  emergency: { label: "EMERGENCY", color: "#dc2626", bg: "rgba(220,38,38,0.12)",  border: "rgba(220,38,38,0.3)" },
};

export default function UploadImagePage() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile]   = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult]   = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedEye, setSelectedEye] = useState<"left" | "right" | "both">("right");
  const [context, setContext] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { setCallId, setUploadResult } = useSessionStore();

  const handleFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("image/") && !f.name.endsWith(".dcm")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setState("uploading");
    setProgress(20);

    try {
      // Build multipart form
      const formData = new FormData();
      formData.append("file", f);
      formData.append("eye", selectedEye);
      formData.append("context", context);

      setProgress(50);
      setState("analyzing");

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(
        `${apiBase}/upload-image`,
        { method: "POST", body: formData }
      );

      setProgress(90);

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();

      // Safely ensure arrays to prevent .map() crashes if the LLM returns strings
      const safeFindings = Array.isArray(data.findings) 
        ? data.findings 
        : (data.findings ? [data.findings] : []);
        
      const safeNextSteps = Array.isArray(data.next_steps) 
        ? data.next_steps 
        : (data.next_steps ? [data.next_steps] : (data.nextSteps ? (Array.isArray(data.nextSteps) ? data.nextSteps : [data.nextSteps]) : []));

      setResult({
        condition:  data.condition  ?? "Unknown condition",
        triage:     data.triage     ?? "monitor",
        confidence: data.confidence ?? 0,
        findings:   safeFindings,
        nextSteps:  safeNextSteps,
      });

      setProgress(100);
      setTimeout(() => {
        setState("done");
        const id = `upload-${Date.now()}`;
        setCallId(id);
        setUploadResult({
          condition:  data.condition  ?? "Unknown condition",
          triage:     data.triage     ?? "monitor",
          confidence: data.confidence ?? 0,
          findings:   safeFindings,
          nextSteps:  safeNextSteps,
        });
      }, 300);

    } catch (err) {
      console.error(err);
      setState("error");
    }
  }, [selectedEye, context, setUploadResult]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const reset = () => {
    setState("idle");
    setFile(null);
    setResult(null);
    setProgress(0);
    setContext("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  // Safely lookup triage configuration, defaulting to "monitor" if invalid
  const getTriageConfig = () => {
    if (!result) return null;
    const safeKey = (result.triage || "monitor").toLowerCase() as keyof typeof triageConfig;
    return triageConfig[safeKey] || triageConfig.monitor;
  };

  const triage = getTriageConfig();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base" style={{ color: "#f1f0ee" }}>
              Upload Image
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#8b8a87" }}>
              Fundus image analysis · DICOM, JPG, PNG
            </p>
          </div>
          {state !== "idle" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
              style={{ color: "#8b8a87" }}
            >
              <RotateCcw size={13} />
              New upload
            </button>
          )}
        </div>
        <div className="rgb-line mt-4" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* DROP ZONE — idle/hover */}
          {state === "idle" && (
            <div
              className="rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer"
              style={{
                borderColor: "rgba(45,212,191,0.2)",
                background: "rgba(45,212,191,0.02)",
                minHeight: "280px",
              }}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setState("hover"); }}
              onDragLeave={() => setState("idle")}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.dcm"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(45,212,191,0.08)",
                    border: "1px solid rgba(45,212,191,0.2)",
                  }}
                >
                  <FileImage size={28} color="#2dd4bf" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base mb-1" style={{ color: "#f1f0ee" }}>
                    Drop fundus image here
                  </p>
                  <p className="text-sm" style={{ color: "#8b8a87" }}>
                    or click to browse your files
                  </p>
                </div>
                <div
                  className="flex items-center gap-3 text-xs px-4 py-2 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#4a4947",
                  }}
                >
                  <span>DICOM</span>
                  <span style={{ color: "#2d2e30" }}>·</span>
                  <span>JPG</span>
                  <span style={{ color: "#2d2e30" }}>·</span>
                  <span>PNG</span>
                  <span style={{ color: "#2d2e30" }}>·</span>
                  <span>TIFF</span>
                </div>
              </div>
            </div>
          )}

          {/* HOVER STATE */}
          {state === "hover" && (
            <div
              className="rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer"
              style={{
                borderColor: "rgba(45,212,191,0.6)",
                background: "rgba(45,212,191,0.04)",
                minHeight: "280px",
              }}
              onDrop={onDrop}
              onDragLeave={() => setState("idle")}
            >
              <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
                <Upload size={36} color="#2dd4bf" className="animate-bounce" />
                <p className="font-semibold" style={{ color: "#2dd4bf" }}>
                  Release to upload
                </p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {state === "error" && (
            <div
              className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
              style={{ background: "#14161a", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle size={32} color="#ef4444" />
              <div>
                <p className="font-semibold mb-1" style={{ color: "#f1f0ee" }}>Analysis Failed</p>
                <p className="text-sm" style={{ color: "#8b8a87" }}>
                  Could not connect to backend. Check your server is running on port 8000.
                </p>
              </div>
              <button
                onClick={reset}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
              >
                Try again
              </button>
            </div>
          )}

          {/* UPLOADING / ANALYZING */}
          {(state === "uploading" || state === "analyzing") && preview && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(45,212,191,0.2)",
                background: "#14161a",
              }}
            >
              {/* Image preview with overlay */}
              <div className="relative" style={{ height: "280px" }}>
                <img
                  src={preview}
                  alt="Fundus image"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.5 }}
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    {/* Outer rings */}
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="scan-ring absolute rounded-full"
                        style={{
                          width: 80 + i * 30,
                          height: 80 + i * 30,
                          border: "1px solid rgba(45,212,191,0.3)",
                          animationDelay: `${i * 0.6}s`,
                        }}
                      />
                    ))}
                    {/* Center */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(45,212,191,0.1)",
                        border: "1.5px solid #2dd4bf",
                        boxShadow: "0 0 20px rgba(45,212,191,0.4)",
                      }}
                    >
                      <Scan size={20} color="#2dd4bf" />
                    </div>
                  </div>
                </div>
                {/* Remove button */}
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(14,15,17,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <X size={12} color="#8b8a87" />
                </button>
              </div>

              {/* Status bar */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="heartbeat-dot w-1.5 h-1.5 rounded-full"
                          style={{ background: "#2dd4bf" }}
                        />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: "#8b8a87" }}>
                      {state === "uploading" ? "Uploading image..." : "Analyzing retinal surface..."}
                    </span>
                  </div>
                  <span className="text-sm font-mono" style={{ color: "#4a4947" }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #2dd4bf, #3b82f6)",
                      boxShadow: "0 0 8px rgba(45,212,191,0.5)",
                    }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: "#4a4947" }}>
                  {file?.name} · {file ? (file.size / 1024).toFixed(1) : 0} KB
                </p>
              </div>
            </div>
          )}

          {/* RESULT STATE */}
          {state === "done" && result && triage && (
            <>
              {/* Image + triage hero */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${triage.border}` }}
              >
                <div className="relative" style={{ height: "220px" }}>
                  {preview && (
                    <img
                      src={preview}
                      alt="Analyzed fundus"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(to top, rgba(14,15,17,0.95) 0%, transparent 50%)",
                    }}
                  />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(14,15,17,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <X size={12} color="#8b8a87" />
                  </button>
                  {/* Triage badge */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-2"
                        style={{ background: triage.bg, border: `1px solid ${triage.border}`, color: triage.color }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: triage.color, boxShadow: `0 0 6px ${triage.color}` }}
                        />
                        {triage.label}
                      </span>
                      <p className="text-sm font-semibold" style={{ color: "#f1f0ee" }}>
                        {result.condition}
                      </p>
                    </div>
                    <div
                      className="flex flex-col items-end"
                      style={{ color: "#8b8a87" }}
                    >
                      <span className="text-xs">Confidence</span>
                      <span className="text-lg font-bold font-mono" style={{ color: triage.color }}>
                        {result.confidence}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="px-5 py-3" style={{ background: "#14161a" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-20 flex-shrink-0" style={{ color: "#4a4947" }}>
                      Confidence
                    </span>
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${result.confidence}%`,
                          background: triage.color,
                          boxShadow: `0 0 8px ${triage.color}66`,
                          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </div>
                    <CheckCircle size={14} color="#22c55e" />
                  </div>
                </div>
              </div>

              {/* Findings */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={15} color="#2dd4bf" />
                  <h3 className="text-sm font-semibold" style={{ color: "#f1f0ee" }}>
                    Clinical Findings
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {result.findings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-1 h-1 rounded-full flex-shrink-0 mt-2"
                        style={{ background: triage.color }}
                      />
                      <p className="text-sm leading-relaxed" style={{ color: "#8b8a87" }}>
                        {finding}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RGB divider */}
              <div className="rgb-line" style={{ animationDuration: "5s" }} />

              {/* Next Steps */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <ChevronRight size={15} color="#2dd4bf" />
                  <h3 className="text-sm font-semibold" style={{ color: "#f1f0ee" }}>
                    Recommended Next Steps
                  </h3>
                </div>
                <div className="space-y-2">
                  {result.nextSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(45,212,191,0.1)", color: "#2dd4bf" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm" style={{ color: "#8b8a87" }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{
                  background: "rgba(245,158,11,0.04)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <Info size={14} color="#f59e0b" className="flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: "#8b8a87" }}>
                  AI-assisted screening guidance only. Not a substitute for a qualified ophthalmologist.
                  Always verify results with a licensed eye care professional.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pb-2">
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8b8a87",
                  }}
                >
                  <RotateCcw size={14} />
                  Upload another
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "#2dd4bf",
                    color: "#0e0f11",
                  }}
                  onClick={() => router.push(`/app/chat?source=upload&condition=${encodeURIComponent(result?.condition ?? "")}`)}
                >
                  Discuss with AI
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* Eye selection + context — shown when file selected but not done */}
          {(state === "idle") && (
            <>
              {/* Eye selector */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-xs font-semibold mb-3" style={{ color: "#4a4947" }}>
                  WHICH EYE?
                </p>
                <div className="flex gap-2">
                  {(["left", "right", "both"] as const).map((eye) => (
                    <button
                      key={eye}
                      onClick={() => setSelectedEye(eye)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                      style={{
                        background: selectedEye === eye ? "rgba(45,212,191,0.1)" : "rgba(255,255,255,0.03)",
                        border: selectedEye === eye ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(255,255,255,0.07)",
                        color: selectedEye === eye ? "#2dd4bf" : "#8b8a87",
                      }}
                    >
                      {eye}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional context */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-xs font-semibold mb-3" style={{ color: "#4a4947" }}>
                  ADDITIONAL CONTEXT <span style={{ color: "#2d2e30" }}>(OPTIONAL)</span>
                </p>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Patient history, known conditions, symptoms..."
                  rows={3}
                  className="w-full bg-transparent text-sm resize-none outline-none placeholder:text-opacity-30"
                  style={{
                    color: "#f1f0ee",
                    caretColor: "#2dd4bf",
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}