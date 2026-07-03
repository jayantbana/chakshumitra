// src/app/(workspace)/app/assessment/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight, ChevronLeft, CheckCircle, BarChart3 } from "lucide-react";

// ── Types ─────────────────────────────────────
type AnswerValue = string | number | null;

interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: "select" | "slider" | "multiselect";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  unit?: string;
}

const QUESTIONS: Question[] = [
  {
    id: "symptom_onset",
    text: "When did your symptoms begin?",
    subtext: "Select the most accurate timeframe",
    type: "select",
    options: [
      { value: "today", label: "Today" },
      { value: "2-7d", label: "2–7 days ago" },
      { value: "1-4w", label: "1–4 weeks ago" },
      { value: "1-6m", label: "1–6 months ago" },
      { value: "6m+", label: "More than 6 months ago" },
    ],
  },
  {
    id: "primary_symptom",
    text: "What is your primary visual complaint?",
    type: "select",
    options: [
      { value: "blur", label: "Blurred vision" },
      { value: "floaters", label: "Floaters or spots" },
      { value: "flashes", label: "Light flashes" },
      { value: "pain", label: "Eye pain or pressure" },
      { value: "redness", label: "Redness or irritation" },
      { value: "field_loss", label: "Loss of peripheral vision" },
    ],
  },
  {
    id: "severity",
    text: "How would you rate the severity?",
    subtext: "1 = Barely noticeable, 10 = Severely affecting daily life",
    type: "slider",
    min: 1,
    max: 10,
    unit: "/10",
  },
  {
    id: "affected_eye",
    text: "Which eye is affected?",
    type: "select",
    options: [
      { value: "left", label: "Left eye only" },
      { value: "right", label: "Right eye only" },
      { value: "both", label: "Both eyes" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "risk_factors",
    text: "Do any of these apply to you?",
    subtext: "Select all that apply",
    type: "multiselect",
    options: [
      { value: "diabetes", label: "Diabetes" },
      { value: "hypertension", label: "High blood pressure" },
      { value: "family_history", label: "Family history of glaucoma" },
      { value: "previous_surgery", label: "Previous eye surgery" },
      { value: "high_myopia", label: "High myopia (–6D or more)" },
      { value: "none", label: "None of the above" },
    ],
  },
  {
    id: "previous_diagnosis",
    text: "Have you been previously diagnosed with an eye condition?",
    type: "select",
    options: [
      { value: "none", label: "No prior diagnosis" },
      { value: "dr", label: "Diabetic Retinopathy" },
      { value: "glaucoma", label: "Glaucoma" },
      { value: "cataract", label: "Cataract" },
      { value: "amd", label: "Age-related Macular Degeneration" },
      { value: "other", label: "Other condition" },
    ],
  },
  {
    id: "last_eye_exam",
    text: "When was your last comprehensive eye examination?",
    type: "select",
    options: [
      { value: "6m", label: "Within the last 6 months" },
      { value: "1y", label: "6–12 months ago" },
      { value: "2y", label: "1–2 years ago" },
      { value: "2y+", label: "More than 2 years ago" },
      { value: "never", label: "Never" },
    ],
  },
];

const DISPLAY_FONT = "var(--font-display, 'Instrument Serif', serif)";
const TEAL = "#2dd4bf";
const SURFACE = "#14161a";
const BORDER = "rgba(255,255,255,0.07)";

// ── Main Page ─────────────────────────────────
export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const totalSteps = QUESTIONS.length;
  const currentQ = step > 0 ? QUESTIONS[step - 1] : null;
  const isIntro = step === 0;
  const isDone = step > totalSteps;
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  const goNext = () => {
    setDirection("forward");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection("back");
    setStep((s) => Math.max(0, s - 1));
  };

  const setAnswer = (id: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMulti = (id: string, value: string) => {
    const current = (answers[id] as string[] | undefined) ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : value === "none"
      ? ["none"]
      : [...current.filter((v) => v !== "none"), value];
    setAnswers((prev) => ({ ...prev, [id]: updated as any }));
  };

  const canProceed = () => {
    if (!currentQ) return true;
    const val = answers[currentQ.id];
    if (currentQ.type === "multiselect") return Array.isArray(val) && val.length > 0;
    if (currentQ.type === "slider") return val !== null && val !== undefined;
    return !!val;
  };

  // ── Submit ───────────────────────────────────
  const handleSubmit = () => {
    setDirection("forward");
    setStep(totalSteps + 1);
  };

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: "#0e0f11" }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
        style={{ borderColor: BORDER }}
      >
        <div>
          <h1
            className="font-display text-xl font-semibold"
            style={{ color: "#f1f0ee", fontFamily: DISPLAY_FONT }}
          >
            Clinical Assessment
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#8b8a87" }}>
            Structured symptom intake
          </p>
        </div>

        {/* Step counter */}
        {!isIntro && !isDone && (
          <span className="text-xs font-mono" style={{ color: "#4a4947" }}>
            {step} / {totalSteps}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!isIntro && !isDone && (
        <div className="h-0.5 w-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${TEAL}, #5eead4)`,
              boxShadow: `0 0 8px rgba(45,212,191,0.4)`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">

        {/* ── INTRO ─────────────────────────── */}
        {isIntro && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(45,212,191,0.08)", border: `1px solid rgba(45,212,191,0.2)` }}
            >
              <ClipboardList size={32} color={TEAL} />
            </div>

            <div>
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: "#f1f0ee", fontFamily: DISPLAY_FONT }}
              >
                Structured Intake Assessment
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#8b8a87", maxWidth: "40ch", margin: "0 auto" }}>
                Answer {totalSteps} clinical questions to help Chakshu Mitra generate a more accurate triage report.
              </p>
            </div>

            {/* Info cards */}
            <div
              className="w-full rounded-xl p-4 flex flex-col gap-3"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              {[
                ["~3 minutes", "Time to complete"],
                [`${totalSteps} questions`, "Symptom, history, and risk factors"],
                ["Structured output", "Results feed directly into AI triage"],
              ].map(([val, desc]) => (
                <div key={val} className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "#f1f0ee" }}>{val}</span>
                  <span className="text-xs" style={{ color: "#4a4947" }}>{desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={goNext}
              className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: TEAL, color: "#0e0f11" }}
            >
              Begin Assessment
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── QUESTION ──────────────────────── */}
        {!isIntro && !isDone && currentQ && (
          <div className="w-full max-w-lg flex flex-col gap-6">

            {/* Question card */}
            <div>
              <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#4a4947" }}>
                QUESTION {step} OF {totalSteps}
              </p>
              <h2
                className="text-xl font-semibold mb-1"
                style={{ color: "#f1f0ee", fontFamily: DISPLAY_FONT }}
              >
                {currentQ.text}
              </h2>
              {currentQ.subtext && (
                <p className="text-sm" style={{ color: "#8b8a87" }}>
                  {currentQ.subtext}
                </p>
              )}
            </div>

            {/* SELECT ──────────────────────── */}
            {currentQ.type === "select" && (
              <div className="flex flex-col gap-2">
                {currentQ.options!.map((opt) => {
                  const selected = answers[currentQ.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(currentQ.id, opt.value)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between"
                      style={{
                        background: selected ? "rgba(45,212,191,0.08)" : SURFACE,
                        border: `1px solid ${selected ? "rgba(45,212,191,0.35)" : BORDER}`,
                        color: selected ? TEAL : "#f1f0ee",
                      }}
                    >
                      <span>{opt.label}</span>
                      {selected && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: TEAL }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3 5.5L6.5 2" stroke="#0e0f11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MULTISELECT ─────────────────── */}
            {currentQ.type === "multiselect" && (
              <div className="flex flex-col gap-2">
                {currentQ.options!.map((opt) => {
                  const selected = ((answers[currentQ.id] as string[]) ?? []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMulti(currentQ.id, opt.value)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3"
                      style={{
                        background: selected ? "rgba(45,212,191,0.08)" : SURFACE,
                        border: `1px solid ${selected ? "rgba(45,212,191,0.35)" : BORDER}`,
                        color: selected ? TEAL : "#f1f0ee",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          background: selected ? TEAL : "transparent",
                          border: `1.5px solid ${selected ? TEAL : "rgba(255,255,255,0.2)"}`,
                        }}
                      >
                        {selected && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3 5.5L6.5 2" stroke="#0e0f11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* SLIDER ──────────────────────── */}
            {currentQ.type === "slider" && (
              <div className="flex flex-col gap-4">
                {/* Value display */}
                <div className="flex justify-between items-end">
                  <span className="text-xs" style={{ color: "#4a4947" }}>
                    {currentQ.min} — Minimal
                  </span>
                  <div
                    className="text-3xl font-semibold font-mono"
                    style={{ color: TEAL, fontFamily: DISPLAY_FONT }}
                  >
                    {answers[currentQ.id] ?? currentQ.min}
                    <span className="text-base ml-0.5" style={{ color: "#4a4947" }}>
                      {currentQ.unit}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#4a4947" }}>
                    {currentQ.max} — Severe
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={currentQ.min}
                  max={currentQ.max}
                  value={(answers[currentQ.id] as number) ?? currentQ.min}
                  onChange={(e) => setAnswer(currentQ.id, parseInt(e.target.value))}
                  className="w-full"
                  style={{
                    accentColor: TEAL,
                    height: "4px",
                    cursor: "pointer",
                  }}
                />

                {/* Severity label */}
                <div className="flex justify-between">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{
                        background:
                          (answers[currentQ.id] as number ?? 1) > i
                            ? TEAL
                            : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: "transparent",
                  border: `1px solid ${BORDER}`,
                  color: "#8b8a87",
                }}
              >
                <ChevronLeft size={14} />
                Back
              </button>

              {step < totalSteps ? (
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: TEAL, color: "#0e0f11" }}
                >
                  Continue
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: TEAL, color: "#0e0f11" }}
                >
                  Submit Assessment
                  <CheckCircle size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── DONE ──────────────────────────── */}
        {isDone && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <CheckCircle size={32} color="#22c55e" />
            </div>

            <div>
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: "#f1f0ee", fontFamily: DISPLAY_FONT }}
              >
                Assessment Complete
              </h2>
              <p className="text-sm" style={{ color: "#8b8a87" }}>
                {totalSteps} questions answered · Ready for AI triage
              </p>
            </div>

            {/* Summary */}
            <div
              className="w-full rounded-xl p-4 flex flex-col gap-2.5"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#4a4947" }}>
                RESPONSE SUMMARY
              </p>
              {QUESTIONS.slice(0, 4).map((q) => {
                const val = answers[q.id];
                const displayVal = Array.isArray(val)
                  ? (val as string[]).join(", ")
                  : q.type === "slider"
                  ? `${val}${q.unit}`
                  : q.options?.find((o) => o.value === val)?.label ?? String(val ?? "—");
                return (
                  <div key={q.id} className="flex items-start justify-between gap-4">
                    <span className="text-xs" style={{ color: "#8b8a87", maxWidth: "60%" }}>
                      {q.text}
                    </span>
                    <span className="text-xs font-medium text-right" style={{ color: "#f1f0ee" }}>
                      {displayVal}
                    </span>
                  </div>
                );
              })}
              {totalSteps > 4 && (
                <p className="text-xs mt-1" style={{ color: "#4a4947" }}>
                  +{totalSteps - 4} more responses
                </p>
              )}
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => router.push("/app/chat")}
                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: TEAL, color: "#0e0f11" }}
              >
                <BarChart3 size={16} />
                View AI Triage Report
              </button>
              <button
                onClick={() => { setStep(0); setAnswers({}); }}
                className="w-full py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "transparent",
                  border: `1px solid ${BORDER}`,
                  color: "#8b8a87",
                }}
              >
                Start New Assessment
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}