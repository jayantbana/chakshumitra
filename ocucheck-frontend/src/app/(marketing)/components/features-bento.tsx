"use client";
import { MessageCircle, Upload, BarChart3 } from "lucide-react";
import { FundusDropZone } from "./fundus-drop-zone";

function IrisVisual() {
  return (
    <div className="relative w-44 h-44">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid rgba(45,212,191,${0.04 + i * 0.04})`,
            margin: `${i * 8}px`,
            boxShadow: `0 0 ${4 + i * 2}px rgba(45,212,191,${0.05 + i * 0.03})`,
          }}
        />
      ))}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 176 176"
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          // Round to 4dp so server and client produce identical strings (fixes hydration mismatch)
          const x1 = parseFloat((88 + 30 * Math.cos(rad)).toFixed(4));
          const y1 = parseFloat((88 + 30 * Math.sin(rad)).toFixed(4));
          const x2 = parseFloat((88 + 80 * Math.cos(rad)).toFixed(4));
          const y2 = parseFloat((88 + 80 * Math.sin(rad)).toFixed(4));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(45,212,191,0.12)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
      <div
        className="absolute rounded-full scan-iris-glow"
        style={{
          width: 52,
          height: 52,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 18,
          height: 18,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background: "#0e0f11",
          border: "1.5px solid rgba(45,212,191,0.5)",
          boxShadow: "0 0 10px rgba(45,212,191,0.4)",
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="scan-ring absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            border: "1px solid rgba(45,212,191,0.3)",
            animationDelay: `${i * 0.66}s`,
          }}
        />
      ))}
    </div>
  );
}

export function FeaturesBento() {
  return (
    <>
      {/* Bento grid */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-bold font-display tracking-tight mb-12">
            Everything in one{" "}
            <span style={{ color: "#2dd4bf" }}>clinical workspace.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* AI Chat */}
            <div className="md:col-span-7 card-elevated p-6 min-h-[280px] flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold font-display mb-1">
                  Condition-aware AI Chat
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "#8b8a87", maxWidth: "38ch" }}
                >
                  Advanced NLP that understands medical nuances, mapping patient
                  descriptions to ophthalmic risk patterns in real-time.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <div
                  className="flex items-start gap-2 text-sm px-3 py-2 rounded-xl w-fit"
                  style={{
                    background: "rgba(45,212,191,0.08)",
                    border: "1px solid rgba(45,212,191,0.15)",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: "#2dd4bf" }}
                  />
                  <span style={{ color: "#f1f0ee" }}>
                    Are you experiencing any sudden flashes or new floaters?
                  </span>
                </div>
                <div
                  className="self-end text-sm px-3 py-2 rounded-xl"
                  style={{
                    background: "#1c1f24",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#f1f0ee",
                  }}
                >
                  Yes, specifically in my left eye since this morning.
                </div>
              </div>
            </div>

            {/* Fundus Drop Zone */}
            <div className="md:col-span-5">
              <FundusDropZone />
            </div>

            {/* Live Scan */}
            <div className="md:col-span-5 card-elevated p-6 min-h-[220px] flex flex-col">
              <h3 className="text-lg font-semibold font-display mb-1">
                Live Scan Engine
              </h3>
              <p className="text-sm mb-4" style={{ color: "#8b8a87" }}>
                Automated pupil tracking and illumination correction for
                smartphone-based triage.
              </p>
              <div className="relative flex-1 flex items-center justify-center">
                <IrisVisual />
              </div>
            </div>

            {/* Triage Badges */}
            <div className="md:col-span-3 card-elevated p-5 flex flex-col gap-3 justify-center">
              {[
                { label: "ROUTINE", cls: "triage-normal",  color: "#22c55e" },
                { label: "MONITOR", cls: "triage-monitor", color: "#f59e0b" },
                { label: "URGENT",  cls: "triage-urgent",  color: "#ef4444" },
              ].map((t) => (
                <div
                  key={t.label}
                  className={`${t.cls} flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: t.color,
                      boxShadow: `0 0 6px ${t.color}`,
                    }}
                  />
                  {t.label}
                </div>
              ))}
            </div>

            {/* Recent Sessions */}
            <div className="md:col-span-4 card-elevated p-5">
              <p
                className="text-xs font-semibold tracking-widest mb-4"
                style={{ color: "#4a4947" }}
              >
                RECENT SESSIONS
              </p>
              {[
                { id: "SID-2940", time: "3m ago" },
                { id: "SID-2938", time: "11m ago" },
                { id: "SID-2931", time: "1h ago" },
              ].map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#f1f0ee" }}
                  >
                    {s.id}
                  </span>
                  <span className="text-xs" style={{ color: "#4a4947" }}>
                    {s.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three inputs section */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-bold font-display tracking-tight mb-14">
            Three inputs.{" "}
            <span style={{ color: "#2dd4bf" }}>One structured result.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                icon: <MessageCircle size={20} color="#2dd4bf" />,
                title: "Describe",
                desc: "Our AI-driven chat captures symptoms, medical history, and onset speed using natural clinical logic.",
              },
              {
                num: "02",
                icon: <Upload size={20} color="#2dd4bf" />,
                title: "Show",
                desc: "Upload professional fundus images or use your smartphone camera for a directed macro scan of the eye exterior.",
              },
              {
                num: "03",
                icon: <BarChart3 size={20} color="#2dd4bf" />,
                title: "Act",
                desc: "Receive a categorized triage report: Low, Moderate, or Urgent, with data-backed reasoning for clinical review.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="card-elevated p-6 flex flex-col gap-4 reveal-up"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span
                  className="text-5xl font-bold font-display"
                  style={{ color: "rgba(255,255,255,0.06)", lineHeight: 1 }}
                >
                  {step.num}
                </span>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(45,212,191,0.1)",
                    border: "1px solid rgba(45,212,191,0.2)",
                  }}
                >
                  {step.icon}
                </div>
                <div>
                  <h3
                    className="font-semibold font-display text-base mb-1.5"
                    style={{ color: "#f1f0ee" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#8b8a87" }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}