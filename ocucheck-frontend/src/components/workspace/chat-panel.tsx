"use client";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/features/chat/hooks/use-chat";
import type { Message, TriageStatus } from "@/features/chat/types";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { EyeSpinner } from "@/components/shared/app-logo";

const TRIAGE_CONFIG: Record<
  NonNullable<TriageStatus>,
  { label: string; icon: typeof AlertTriangle; classes: string; score: [number, number] }
> = {
  normal: {
    label: "All clear",
    icon: CheckCircle2,
    classes: "bg-success/10 text-success shadow-[0_0_8px_2px_oklch(0.65_0.2_140deg/0.5)] border-[oklch(0.65_0.2_140deg/0.4)]",
    score: [80, 95],
  },
  monitor: {
    label: "Monitor closely",
    icon: Clock,
    classes: "bg-warning/10 text-warning shadow-[0_0_8px_2px_oklch(0.7_0.18_55deg/0.5)] border-[oklch(0.7_0.18_55deg/0.4)]",
    score: [55, 72],
  },
  urgent: {
    label: "Seek care soon",
    icon: AlertTriangle,
    classes: "bg-error/10 text-error shadow-[0_0_8px_2px_oklch(0.65_0.2_25deg/0.5)] border-[oklch(0.65_0.2_25deg/0.4)]",
    score: [25, 48],
  },
  emergency: {
    label: "Seek immediate care",
    icon: AlertTriangle,
    classes: "bg-error/10 text-error animate-pulse shadow-[0_0_8px_2px_oklch(0.65_0.2_20deg/0.5)] border-[oklch(0.65_0.2_20deg/0.4)]",
    score: [0, 20],
  },
};

// Derive a deterministic-ish Chakshu Mitra score from triage
function getOcuScore(status: NonNullable<TriageStatus>): number {
  const [lo, hi] = TRIAGE_CONFIG[status].score;
  // Simple seeded value so it doesn't jump on re-render
  return lo + Math.floor(((lo * 7 + hi * 3) % (hi - lo + 1)));
}

const QUICK_CHIPS_EMPTY = [
  "I have blurry vision",
  "Check my scan",
  "What is glaucoma?",
];

interface ChatPanelProps {
  initialMessage?: string;
}

export function ChatPanel({ initialMessage }: ChatPanelProps) {
  const { messages, isLoading, activeProtocol, triageStatus, videoStreamActive, error, sendMsg, clearError } =
    useChat(initialMessage);

  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-send initial message
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      sendMsg(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim()) {
      sendMsg(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triage = triageStatus ? TRIAGE_CONFIG[triageStatus] : null;
  const ocuScore = triageStatus ? getOcuScore(triageStatus) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text tracking-tight truncate">
              {activeProtocol ? `Protocol: ${activeProtocol}` : "Symptom assessment"}
            </p>
            <p className="text-xs text-text-faint">AI-guided diagnostic conversation</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Chakshu Mitra Score badge */}
          {ocuScore !== null && triage && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold animate-badge-reveal",
              triage.classes
            )}>
              <span className="font-mono">{ocuScore}</span>
              <span className="opacity-70 font-normal">/100</span>
            </div>
          )}

          {triage && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium animate-badge-reveal",
              triage.classes
            )}>
              <triage.icon size={12} strokeWidth={2} />
              {triage.label}
            </div>
          )}
          {videoStreamActive && (
            <Link
              href={ROUTES.live}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Video size={12} />
              Live scan available
            </Link>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-error/10 border-b border-error/20">
          <AlertTriangle size={15} className="text-error flex-shrink-0" />
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={clearError} className="text-error/60 hover:text-error p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {activeProtocol && (
          <div className="rgb-border rounded-lg px-4 py-2.5 flex items-center gap-3 bg-surface my-3">
            <span className="rgb-text text-xs font-semibold uppercase tracking-wider">
              {activeProtocol} Protocol Active
            </span>
            <div className="rgb-line flex-1 h-px" />
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none" className="rgb-text flex-shrink-0">
              <path d="M6 16C6 16 10 9 16 9C22 9 26 16 26 16C26 16 22 23 16 23C10 23 6 16 6 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Enhanced empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60%] text-center py-12 gap-6">
            {/* Animated eye scan pulse */}
            <div className="relative flex items-center justify-center">
              {/* Concentric pulse rings */}
              <span className="scan-ring absolute w-20 h-20 rounded-full border border-primary/20" />
              <span className="scan-ring absolute w-20 h-20 rounded-full border border-primary/15" />
              <span className="scan-ring absolute w-20 h-20 rounded-full border border-primary/10" />
              {/* Eye icon center */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-primary">
                  <path d="M6 16C6 16 10 9 16 9C22 9 26 16 26 16C26 16 22 23 16 23C10 23 6 16 6 16Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" className="animate-eye-iris" style={{ transformOrigin: "16px 16px" }} />
                  <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text mb-2">Ready for assessment</p>
              <p className="text-sm text-text-muted max-w-xs leading-relaxed">
                Describe your symptoms, upload a fundus image,<br />or start a live scan.
              </p>
            </div>

            {/* Quick-action chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_CHIPS_EMPTY.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMsg(chip)}
                  className="text-xs px-3.5 py-2 rounded-full border border-border bg-surface-offset hover:bg-surface-dynamic hover:border-primary/30 text-text-muted hover:text-text transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <HeartbeatTypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-surface px-4 py-4">
        {/* Quick action chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {["Upload an eye image", "Start live scan", "Tell me more"].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                if (chip === "Upload an eye image") {
                  // handled by workspace store in production
                } else if (chip === "Start live scan") {
                  window.location.href = ROUTES.live;
                } else {
                  sendMsg(chip);
                }
              }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-surface-offset text-text-muted hover:text-text hover:bg-surface-dynamic transition-colors"
            >
              {chip === "Upload an eye image" && <Upload size={10} />}
              {chip === "Start live scan" && <Video size={10} />}
              {chip}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-end">
          <div className={cn(
            "flex-1 relative rounded-xl border border-border bg-surface-2 transition-all",
            isFocused && "rgb-border"
          )}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe your symptoms…"
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent px-4 py-3",
                "text-sm text-text placeholder:text-text-faint",
                "focus:outline-none",
                "transition-all duration-150",
                "max-h-32 overflow-y-auto"
              )}
              style={{ height: "auto" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              "flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl",
              "bg-primary text-text-inverse",
              "hover:bg-primary-hover active:bg-primary-active",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-colors duration-150"
            )}
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>

        <p className="text-xs text-text-faint mt-2 text-center font-mono">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/* ─── Message Bubble — clinical records style ─────────── */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [showTimestamp, setShowTimestamp] = useState(false);

  return (
    <div
      className={cn("flex group message-bubble", isUser ? "justify-end" : "justify-start gap-2.5")}
    >
      {/* AI avatar — eye icon */}
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
          <svg width="12" height="12" viewBox="0 0 32 32" fill="none" className="text-primary">
            <path d="M6 16C6 16 10 9 16 9C22 9 26 16 26 16C26 16 22 23 16 23C10 23 6 16 6 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>
      )}

      <div
        className={cn(
          "relative flex flex-col",
          isUser ? "items-end max-w-[75%]" : "items-start max-w-[82%]"
        )}
        onMouseEnter={() => setShowTimestamp(true)}
        onMouseLeave={() => setShowTimestamp(false)}
      >
        {!isUser && (
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 text-text-faint">
            {message.isProtocol ? "Protocol" : "Chakshu Mitra AI"}
          </p>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-surface-offset text-text rounded-br-md"
              : "bg-surface border border-border text-text rounded-bl-md shadow-sm"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp — only on hover */}
        <p
          className={cn(
            "text-[10px] mt-1 font-mono text-text-faint transition-opacity duration-150",
            isUser ? "text-right" : "text-left",
            showTimestamp ? "opacity-100" : "opacity-0"
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

/* ─── Heartbeat Typing Indicator ─────────────────────── */
function HeartbeatTypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5 message-bubble">
      {/* AI avatar */}
      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
        <svg width="12" height="12" viewBox="0 0 32 32" fill="none" className="text-primary">
          <path d="M6 16C6 16 10 9 16 9C22 9 26 16 26 16C26 16 22 23 16 23C10 23 6 16 6 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col items-start max-w-[82%]">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 text-text-faint">
          Chakshu Mitra AI
        </p>
        <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="heartbeat-dot w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}