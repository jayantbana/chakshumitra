"use client";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Menu } from "lucide-react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/app/new":        { title: "New Assessment",       subtitle: "SYSTEM STATUS: OPTIMAL" },
  "/app/chat":       { title: "AI Consultation",      subtitle: "Condition-aware diagnostic chat" },
  "/app/upload":     { title: "Upload Image",         subtitle: "Fundus image analysis" },
  "/app/live":       { title: "Live Diagnostic",      subtitle: "Camera-assisted eye screening" },
  "/app/assessment": { title: "Assessment",           subtitle: "Structured questionnaire" },
  "/app/history":    { title: "Session History",      subtitle: "Past assessments and results" },
  "/app/settings":   { title: "Settings",             subtitle: "Preferences and configuration" },
  "/app/account":    { title: "Account",              subtitle: "Profile and security" },
};

export function WorkspaceHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = PAGE_META[pathname] ?? { title: "Chakshu Mitra", subtitle: "" };

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 h-12"
      style={{
        background: "#0c0e10",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/5"
          style={{ color: "#8b8a87" }}
          aria-label="Go back"
        >
          <ArrowLeft size={14} />
        </button>
        <div>
          <p className="text-sm font-semibold font-display leading-tight" style={{ color: "#f1f0ee" }}>
            {meta.title}
          </p>
          <p className="text-[10px] tracking-widest" style={{ color: "#4a4947" }}>
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Live precision engine indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest"
          style={{
            background: "rgba(45,212,191,0.06)",
            border: "1px solid rgba(45,212,191,0.15)",
            color: "#2dd4bf",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: "#2dd4bf",
              boxShadow: "0 0 4px #2dd4bf",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          LIVE PRECISION ENGINE
        </div>

        {/* Action button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          style={{
            background: "rgba(45,212,191,0.12)",
            border: "1px solid rgba(45,212,191,0.25)",
            color: "#2dd4bf",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#2dd4bf" }}
          />
          ACTION
        </button>

        <button
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/5"
          style={{ color: "#8b8a87" }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </header>
  );
}