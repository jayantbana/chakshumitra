"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Bot, User, Loader2, Eye, ChevronRight, ImageIcon, X } from "lucide-react";
import { useSessionStore } from "@/store/session-store";

type Role = "user" | "assistant";
type TriageStatus = "normal" | "monitor" | "urgent" | "emergency";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  triage?: TriageStatus;
  protocol?: string;
}

const triageConfig = {
  normal:    { label: "ROUTINE",    color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  monitor:   { label: "MONITOR",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  urgent:    { label: "URGENT",    color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)" },
  emergency: { label: "EMERGENCY", color: "#dc2626", bg: "rgba(220,38,38,0.12)",  border: "rgba(220,38,38,0.3)" },
};

const STARTERS = [
  "I've been experiencing blurred vision in my left eye since yesterday.",
  "I have floaters and occasional flashes of light.",
  "My eyes feel dry and irritated constantly.",
  "I have diabetes — what eye complications should I watch for?",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { uploadResult, clearUploadResult, setCallId } = useSessionStore();

  const source = searchParams.get("source");
  const condition = searchParams.get("condition");
  
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [threadId]                = useState(() => `thread-${Date.now()}`);
  const [triageStatus, setTriageStatus] = useState<TriageStatus | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const [videoStreamActive, setVideoStreamActive] = useState(false);
  const [contextBanner, setContextBanner] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const contextSentRef = useRef(false);
  const uploadConditionRef = useRef<string | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string, isAuto = false) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      "user",
      content:   text.trim(),
      timestamp: new Date(),
    };

    const displayMsg: Message = isAuto
      ? {
          ...userMsg,
          content: `📎 Asking about uploaded image: **${condition ?? uploadResult?.condition ?? "fundus scan"}**`,
        }
      : userMsg;

    setMessages((prev) => [...prev, displayMsg]);
    setInput("");
    setLoading(true);

    try {
      const diagnosisContext = uploadConditionRef.current;
      const messageToSend = diagnosisContext
        ? `[Context: Patient was diagnosed with ${diagnosisContext}]\n\n${text.trim()}`
        : text.trim();

      // Don't clear uploadConditionRef — keep it for ALL follow-ups in this session

      const res = await fetch(`${API_URL}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:   "user-001",
          thread_id: threadId,
          message:   messageToSend,
          upload_context: isAuto && uploadResult ? {
            condition:  uploadResult.condition,
            triage:     uploadResult.triage,
            confidence: uploadResult.confidence,
            findings:   uploadResult.findings,
            next_steps: uploadResult.nextSteps,
          } : undefined,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();

      const assistantMsg: Message = {
        id:        `a-${Date.now()}`,
        role:      "assistant",
        content:   data.response ?? "I couldn't process that. Please try again.",
        timestamp: new Date(),
        triage:    data.triage_status,
        protocol:  data.active_protocol,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.triage_status)   setTriageStatus(data.triage_status);
      if (data.active_protocol) setActiveProtocol(data.active_protocol);
      if (data.call_id) {
        setCallId(data.call_id);
      }
      if (data.video_stream_active) {
        setVideoStreamActive(true);
        setTimeout(() => {
          router.push("/app/live");
        }, 2000);
      }

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id:        `err-${Date.now()}`,
          role:      "assistant",
          content:   "⚠️ Could not reach the Chakshu Mitra backend. Make sure your server is running on port 8000.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, threadId, uploadResult, condition, uploadConditionRef]);

  useEffect(() => {
    if (!uploadResult || contextSentRef.current) return;
    contextSentRef.current = true;

    // Store condition for follow-ups
    uploadConditionRef.current = uploadResult.condition;

    // Send auto-message to backend WITH upload_context
    // This triggers: upload_context_node → assessment_protocol (first question)
    sendMessage(`Please explain my ${uploadResult.condition} diagnosis and begin the assessment.`, true);

  }, [uploadResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(45,212,191,0.1)",
                border: "1px solid rgba(45,212,191,0.2)",
              }}
            >
              <Eye size={15} color="#2dd4bf" />
            </div>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: "#f1f0ee" }}>
                Chakshu Mitra AI
              </h1>
              <p className="text-xs" style={{ color: "#8b8a87" }}>
                {source === "upload" ? "Following up on uploaded image" : "Clinical symptom assessment"}
              </p>
            </div>
          </div>

          {/* Live triage badge */}
          {triageStatus && triageStatus in triageConfig && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest protocol-banner"
              style={{
                background: triageConfig[triageStatus].bg,
                border:     `1px solid ${triageConfig[triageStatus].border}`,
                color:      triageConfig[triageStatus].color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: triageConfig[triageStatus].color,
                  boxShadow:  `0 0 6px ${triageConfig[triageStatus].color}`,
                }}
              />
              {triageConfig[triageStatus].label}
            </span>
          )}
        </div>

        {/* Active protocol banner */}
        {activeProtocol && (
          <div
            className="mt-3 px-3 py-2 rounded-lg text-xs protocol-banner"
            style={{
              background: "rgba(45,212,191,0.06)",
              border:     "1px solid rgba(45,212,191,0.15)",
              color:      "#2dd4bf",
            }}
          >
            <span style={{ color: "#4a4947" }}>Active protocol: </span>
            {activeProtocol}
          </div>
        )}

        {source === "upload" && uploadResult && contextBanner && (
          <div
            className="mt-3 px-3 py-2.5 rounded-xl flex items-start justify-between gap-3 protocol-banner"
            style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)" }}
          >
            <div className="flex items-start gap-2.5">
              <ImageIcon size={13} color="#2dd4bf" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold" style={{ color: "#2dd4bf" }}>
                  Image context loaded
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8b8a87" }}>
                  {uploadResult.condition} · {uploadResult.triage.toUpperCase()} · {uploadResult.confidence}% confidence
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setContextBanner(false);
                clearUploadResult();
              }}
              className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity"
            >
              <X size={12} color="#8b8a87" />
            </button>
          </div>
        )}

        <div className="rgb-line mt-3" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 scan-iris-glow"
                style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
              >
                <Bot size={28} color="#2dd4bf" />
              </div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: "#f1f0ee", fontFamily: "var(--font-display)" }}
              >
                Describe your symptoms
              </h2>
              <p className="text-sm" style={{ color: "#8b8a87", maxWidth: "36ch", margin: "0 auto" }}>
                Chakshu Mitra will map your symptoms to ophthalmic risk patterns and provide structured triage guidance.
              </p>
            </div>

            {/* Starter prompts */}
            <div className="w-full max-w-md space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all hover:border-teal-500/30"
                  style={{
                    background: "#14161a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#8b8a87",
                  }}
                >
                  <ChevronRight size={12} color="#2dd4bf" className="inline mr-2 mb-0.5" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 message-bubble ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{
                background: msg.role === "user"
                  ? "rgba(59,130,246,0.15)"
                  : "rgba(45,212,191,0.1)",
                border: msg.role === "user"
                  ? "1px solid rgba(59,130,246,0.3)"
                  : "1px solid rgba(45,212,191,0.2)",
              }}
            >
              {msg.role === "user"
                ? <User size={13} color="#3b82f6" />
                : <Bot size={13} color="#2dd4bf" />
              }
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: "75%" }}>
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.role === "user"
                    ? "rgba(59,130,246,0.1)"
                    : "#14161a",
                  border: msg.role === "user"
                    ? "1px solid rgba(59,130,246,0.2)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: "#f1f0ee",
                  borderRadius: msg.role === "user"
                    ? "18px 4px 18px 18px"
                    : "4px 18px 18px 18px",
                }}
              >
                {msg.content}
              </div>

              {/* Triage badge under assistant message */}
              {msg.triage && msg.triage in triageConfig && (
                <div className="mt-1.5 ml-1">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider"
                    style={{
                      background: triageConfig[msg.triage].bg,
                      border:     `1px solid ${triageConfig[msg.triage].border}`,
                      color:      triageConfig[msg.triage].color,
                    }}
                  >
                    {triageConfig[msg.triage].label}
                  </span>
                </div>
              )}

              <p className="text-xs mt-1 px-1" style={{ color: "#2d2e30" }}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div className="flex gap-3 message-bubble">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              <Bot size={13} color="#2dd4bf" />
            </div>
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-1"
              style={{ background: "#14161a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 18px 18px 18px" }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="heartbeat-dot w-1.5 h-1.5 rounded-full"
                  style={{ background: "#2dd4bf", animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 px-5 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0e0f11" }}
      >
        <div
          className="flex items-end gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "#14161a",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none"
            style={{
              color:       "#f1f0ee",
              caretColor:  "#2dd4bf",
              maxHeight:   "120px",
              lineHeight:  "1.5",
            }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{
              background: input.trim() ? "#2dd4bf" : "rgba(45,212,191,0.1)",
              border:     "1px solid rgba(45,212,191,0.3)",
            }}
          >
            {loading
              ? <Loader2 size={14} color="#0e0f11" className="animate-spin" />
              : <Send size={14} color={input.trim() ? "#0e0f11" : "#2dd4bf"} />
            }
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: "#2d2e30" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}