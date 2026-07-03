import Link from "next/link";
import { ImageUp, MessageSquare, BarChart2 } from "lucide-react";
import { redirect } from "next/navigation";

const QUICK_ACTIONS = [
  {
    href:  "/app/upload",
    icon:  ImageUp,
    label: "Import OCT Scan",
    desc:  "Supports DICOM, TIFF, and high-fidelity PNG formats.",
  },
  {
    href:  "/app/chat",
    icon:  MessageSquare,
    label: "AI Consultation",
    desc:  "Real-time diagnosis support with neural cross-referencing.",
  },
  {
    href:  "/app/history",
    icon:  BarChart2,
    label: "Batch History",
    desc:  "Review patient longitudinal data and previous scan trends.",
  },
];

export default function NewAssessmentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">

      {/* Empty state */}
      <div className="flex flex-col items-center text-center mb-14 max-w-md">
        {/* Icon */}
        <div className="mb-6 relative">
          {/* Outer rings */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              border: "1px solid rgba(45,212,191,0.15)",
              background: "rgba(45,212,191,0.04)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                border: "1px solid rgba(45,212,191,0.25)",
                background: "rgba(45,212,191,0.06)",
              }}
            >
              <MicroscopeIcon />
            </div>
          </div>
          {/* Scan rings */}
          {[0, 1].map((i) => (
            <div
              key={i}
              className="scan-ring absolute inset-0 rounded-full"
              style={{
                border: "1px solid rgba(45,212,191,0.2)",
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        <h1
          className="font-display text-2xl font-semibold mb-3 tracking-tight"
          style={{ color: "#f1f0ee" }}
        >
          Precision Engine Ready
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#8b8a87" }}>
          Select a tool from the sidebar or upload a high-resolution optical
          scan to begin clinical analysis. Chakshu Mitra is currently monitoring
          with{" "}
          <span
            className="font-semibold"
            style={{ color: "#2dd4bf" }}
          >
            99.8% detection accuracy
          </span>
          .
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="card-elevated group flex flex-col gap-3 p-5 transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: "rgba(45,212,191,0.08)",
                border: "1px solid rgba(45,212,191,0.15)",
              }}
            >
              <action.icon size={15} color="#2dd4bf" strokeWidth={1.75} />
            </div>
            <div>
              <p
                className="text-sm font-semibold font-display mb-1"
                style={{ color: "#f1f0ee" }}
              >
                {action.label}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#8b8a87" }}>
                {action.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MicroscopeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#2dd4bf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18h8" />
      <path d="M3 21h18" />
      <path d="M14 21v-4" />
      <path d="M14 7v4h4" />
      <path d="M10 3v10" />
      <path d="M6 7l4-4 4 4" />
    </svg>
  );
}