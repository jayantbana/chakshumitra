"use client";
import { use, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Activity,
  Stethoscope,
  Info,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDiagnosticResults } from "@/features/results/hooks/use-diagnostic-results";
import { ROUTES } from "@/lib/constants/routes";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useRouter } from "next/navigation";
import type { DiagnosticResultData } from "@/features/results/types";
import { EyeSpinner } from "@/components/shared/app-logo";

// Triage configuration
const TRIAGE_CONFIG = {
  normal: {
    label: "All clear",
    sublabel: "No immediate concern detected",
    icon: CheckCircle2,
    colors: "bg-success/10 text-success border-success/30",
    dotColor: "bg-success",
    scoreLo: 80, scoreHi: 95,
    scoreColor: "text-success",
    arcColor: "var(--color-success)",
  },
  monitor: {
    label: "Monitor closely",
    sublabel: "Keep an eye on this condition",
    icon: Clock,
    colors: "bg-warning/10 text-warning border-warning/30",
    dotColor: "bg-warning",
    scoreLo: 55, scoreHi: 72,
    scoreColor: "text-warning",
    arcColor: "var(--color-warning)",
  },
  urgent: {
    label: "Seek care soon",
    sublabel: "Consider seeing an eye care professional",
    icon: AlertTriangle,
    colors: "bg-error/10 text-error border-error/30",
    dotColor: "bg-error",
    scoreLo: 25, scoreHi: 48,
    scoreColor: "text-error",
    arcColor: "var(--color-error)",
  },
  emergency: {
    label: "Seek immediate care",
    sublabel: "Please visit an eye care professional or emergency room",
    icon: AlertTriangle,
    colors: "bg-error/10 text-error border-error/30",
    dotColor: "bg-error animate-ping",
    scoreLo: 0, scoreHi: 20,
    scoreColor: "text-error",
    arcColor: "var(--color-error)",
  },
};

// Condition education snippets
const CONDITION_EDUCATION: Record<string, { bullets: string[] }> = {
  default: {
    bullets: [
      "This condition can affect vision quality and comfort if left unmonitored.",
      "Early intervention typically leads to better outcomes.",
      "Regular follow-up with an eye care professional is recommended.",
    ],
  },
  glaucoma: {
    bullets: [
      "Glaucoma damages the optic nerve, often caused by elevated eye pressure.",
      "It is a leading cause of blindness but is manageable if caught early.",
      "Treatment includes eye drops, laser therapy, or surgery to reduce pressure.",
    ],
  },
  cataract: {
    bullets: [
      "Cataracts cause the lens of the eye to become cloudy, blurring vision.",
      "They develop slowly and are most common in older adults.",
      "Surgical removal of the cloudy lens and replacement with an artificial one is the standard treatment.",
    ],
  },
  pterygium: {
    bullets: [
      "Pterygium is a benign growth of tissue on the whites of the eye that can extend onto the cornea.",
      "It is commonly associated with UV exposure and dry, dusty environments.",
      "Mild cases are managed with lubricating drops; severe cases may require surgical removal.",
    ],
  },
  stye: {
    bullets: [
      "A stye is a painful, red lump near the edge of the eyelid caused by a bacterial infection.",
      "Most styes resolve on their own within 1–2 weeks with warm compress treatment.",
      "If persistent or growing, medical drainage or antibiotics may be needed.",
    ],
  },
};

function getEducation(condition?: string) {
  if (!condition) return CONDITION_EDUCATION.default;
  const key = condition.toLowerCase();
  for (const k of Object.keys(CONDITION_EDUCATION)) {
    if (key.includes(k)) return CONDITION_EDUCATION[k];
  }
  return CONDITION_EDUCATION.default;
}

function getOcuScore(status: keyof typeof TRIAGE_CONFIG): number {
  const cfg = TRIAGE_CONFIG[status];
  return cfg.scoreLo + Math.floor(((cfg.scoreLo * 7 + cfg.scoreHi * 3) % (cfg.scoreHi - cfg.scoreLo + 1)));
}

// Circular arc gauge for Chakshu Mitra Score
function ScoreGauge({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const dash = pct * circ;
  const gap = circ - dash;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" fill="none" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="6" className="text-surface-offset" />
          {/* Fill */}
          <circle
            cx="40" cy="40" r={r}
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: "stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono leading-none text-text">{score}</span>
          <span className="text-[9px] text-text-faint leading-none mt-0.5">/100</span>
        </div>
      </div>
      <p className="text-xs text-text-faint text-center">Eye Health Score</p>
    </div>
  );
}

// Education expandable card
function ConditionEducationCard({ condition }: { condition: string }) {
  const [open, setOpen] = useState(false);
  const ed = getEducation(condition);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-surface-offset transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-text">What is {condition}?</span>
        </div>
        {open ? <ChevronUp size={14} className="text-text-faint" /> : <ChevronDown size={14} className="text-text-faint" />}
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-border">
          <ul className="mt-3 space-y-2">
            {ed.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ caseID: string }>;
}) {
  const { caseID } = use(params);
  const { data, pollingStatus, error, attempts, retry } =
    useDiagnosticResults(caseID);

  const [localResult, setLocalResult] = useState<DiagnosticResultData | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__lastScanResult) {
      const stored = (window as any).__lastScanResult;
      if (stored.call_id === caseID) {
        setLocalResult(stored);
      }
    }
  }, [caseID]);

  const displayData = localResult ?? data;
  const displayStatus = localResult ? "success" : pollingStatus;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface px-5 py-3.5 flex items-center gap-3">
        <Link
          href={ROUTES.workspace}
          aria-label="Back to workspace"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text hover:bg-surface-offset transition-colors"
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <p className="text-sm font-semibold tracking-tight text-text">Diagnostic results</p>
          <p className="text-xs text-text-faint font-mono">Case {caseID}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-3xl mx-auto">
          {displayStatus === "polling" && <SkeletonLoadingState attempts={attempts} />}

          {(displayStatus === "error" || displayStatus === "timeout") && (
            <ErrorState message={error ?? "An unexpected error occurred."} onRetry={retry} />
          )}

          {displayStatus === "success" && displayData && (
            <ResultsView data={displayData} caseId={caseID} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loading — matches exact shape of results card ─
function SkeletonLoadingState({ attempts }: { attempts: number }) {
  const steps = [
    "Retrieving session data",
    "Processing diagnostic inputs",
    "Evaluating condition indicators",
    "Generating structured summary",
  ];
  const currentStep = Math.min(Math.floor((attempts / 20) * steps.length), steps.length - 1);

  return (
    <div className="space-y-5">
      {/* Skeleton mimics the exact results card shape */}
      <div className="space-y-4">
        {/* Triage badge skeleton */}
        <div className="skeleton-badge w-48" />

        {/* Two-column skeleton */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left col skeleton */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="skeleton w-4 h-4 rounded-full" />
              <div className="skeleton-line w-32" />
            </div>
            {/* Score gauge skeleton */}
            <div className="flex justify-center">
              <div className="skeleton w-20 h-20 rounded-full" />
            </div>
            {/* Confidence bar skeleton */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <div className="skeleton-line w-28" />
                <div className="skeleton-line w-10" />
              </div>
              <div className="skeleton w-full h-1.5 rounded-full" />
            </div>
          </div>

          {/* Right col skeleton */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-sm">
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-full" />
            <div className="skeleton-line w-5/6" />
            <div className="skeleton-line w-4/6" />
          </div>
        </div>

        {/* Progress steps */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={cn(
                "w-5 h-5 rounded-full shrink-0 flex items-center justify-center",
                i < currentStep ? "bg-success text-text-inverse" : i === currentStep ? "bg-primary/20" : "bg-surface-offset"
              )}>
                {i < currentStep ? <CheckCircle2 size={12} /> : i === currentStep ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : null}
              </div>
              <span className={cn("text-sm", i < currentStep ? "text-text line-through opacity-50" : i === currentStep ? "text-text font-medium" : "text-text-faint")}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-faint text-center font-mono">
        Analyzing… usually a few seconds
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-12 space-y-5">
      <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
        <AlertTriangle size={22} className="text-error" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-text mb-1.5">Results unavailable</h2>
        <p className="text-sm text-text-muted max-w-sm">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text hover:bg-surface-offset transition-colors"
      >
        <RotateCcw size={14} />
        Retry
      </button>
      <Link href={ROUTES.workspace} className="text-sm text-primary hover:text-primary-hover transition-colors">
        Return to workspace
      </Link>
    </div>
  );
}

function ResultsView({ data, caseId }: { data: DiagnosticResultData; caseId: string }) {
  const router = useRouter();
  const { setActivePanel } = useWorkspaceStore();

  const triage = data.triage_status
    ? TRIAGE_CONFIG[data.triage_status as keyof typeof TRIAGE_CONFIG]
    : null;

  const score = data.triage_status
    ? getOcuScore(data.triage_status as keyof typeof TRIAGE_CONFIG)
    : null;

  return (
    <div className="space-y-4">

      {/* Triage badge — animated reveal */}
      {triage && (
        <div className={cn(
          "flex items-start gap-4 rounded-2xl border px-5 py-4 animate-badge-reveal",
          triage.colors
        )}>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <span className={cn("w-2 h-2 rounded-full", triage.dotColor)} />
            <triage.icon size={18} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base tracking-tight">{triage.label}</p>
            <p className="text-sm opacity-80 mt-0.5">{triage.sublabel}</p>
          </div>
          {/* Chakshu Mitra Score — right side of triage banner */}
          {score !== null && (
            <div className="shrink-0">
              <ScoreGauge score={score} color={triage.arcColor} label={triage.label} />
            </div>
          )}
        </div>
      )}

      {/* Two-column layout on desktop */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* LEFT — Condition + Confidence */}
        {data.condition && (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Stethoscope size={15} className="text-text-faint" />
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Indicated condition
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-text leading-tight">
              {data.condition}
            </p>

            {typeof data.confidence === "number" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Assessment confidence</span>
                  <span className="font-mono font-medium text-text">
                    {Math.round(data.confidence * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-surface-offset rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${data.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT — Recommendations */}
        {data.recommendation && (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Info size={15} className="text-text-faint" />
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Recommended next steps
              </p>
            </div>
            <p className="text-sm text-text leading-relaxed">{data.recommendation}</p>
          </div>
        )}
      </div>

      {/* Condition education card */}
      {data.condition && (
        <ConditionEducationCard condition={data.condition} />
      )}

      {/* Session metadata */}
      <div className="rounded-2xl border border-border bg-surface-offset px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={15} className="text-text-faint" />
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Session details
          </p>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Case ID</dt>
            <dd className="font-mono text-text text-xs">{caseId}</dd>
          </div>
          {data.triage_status && (
            <div className="flex justify-between">
              <dt className="text-text-muted">Triage level</dt>
              <dd className="text-text capitalize font-mono text-xs">{data.triage_status}</dd>
            </div>
          )}
          {score !== null && (
            <div className="flex justify-between">
              <dt className="text-text-muted">Eye Health Score</dt>
              <dd className="font-mono text-text text-xs font-semibold">{score}/100</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Medical disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3.5">
        <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-warning/90 leading-relaxed">
          This is AI-assisted guidance only and not a medical diagnosis. Always consult a qualified eye care professional for any eye health concerns.
        </p>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => {
            setActivePanel("chat");
            router.push(ROUTES.workspace);
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text hover:bg-surface-offset hover:shadow-card transition-all"
        >
          <MessageSquare size={15} />
          Continue in chat
        </button>
        <button
          onClick={() => { window.location.href = ROUTES.workspace; }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-text-inverse hover:bg-primary-hover transition-colors"
        >
          Start new assessment
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
