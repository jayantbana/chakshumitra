import Link from "next/link";
import { ArrowRight, Eye, Upload, Camera, FileText, Shield, Lock, Users, MessageCircle, BarChart3 } from "lucide-react";
import { FeaturesBento } from "./components/features-bento";
import { ScrollReveal } from "./components/scroll-reveal";

export default function LandingPage() {
  return (
    <main className="bg-[#0a0f0e] text-white overflow-x-hidden">
      <ScrollReveal />

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0a0f0e]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <OcuLogo />
          <span className="font-semibold text-white text-sm tracking-tight">Chakshu Mitra</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest uppercase">
          <a href="#technology" className="text-[#2dd4bf]">Technology</a>
          <a href="#precision" className="text-white/50 hover:text-white transition-colors">Precision</a>
          <a href="#research" className="text-white/50 hover:text-white transition-colors">Research</a>
          <a href="#network" className="text-white/50 hover:text-white transition-colors">Network</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/system-guides" className="text-xs text-white/50 hover:text-white transition-colors">System Guides</Link>
          <Link href="/app" className="px-4 py-2 text-xs font-semibold bg-[#2dd4bf] text-[#0a0f0e] rounded-md hover:bg-[#14b8a6] transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="relative w-full max-w-6xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2dd4bf]/20 bg-[#2dd4bf]/5 text-xs text-[#2dd4bf] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
              AI Eye Screening
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-medium leading-[0.95] tracking-tight">
              Eye screening<br />
              that<br />
              <span className="text-[#2dd4bf]">works as fast</span><br />
              as you do.
            </h1>

            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Describe symptoms, upload retinal images, or perform a live scan. Receive a structured AI triage in under 60 seconds.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <Link href="/app" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2dd4bf] text-[#0a0f0e] text-sm font-semibold rounded-md hover:bg-[#14b8a6] transition-all hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                Start free assessment
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                See how it works <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right: Product Mockup */}
          {/* 
            ⚠️ IMAGE NEEDED: Replace the placeholder below with a dark UI screenshot 
            of the Chakshu Mitra chat/scan interface. The image should show:
            - Dark card with a scan ring animation (eye scan in a box)
            - Status bar at bottom showing "Analysing Surface..."
            - Teal accent colors
            Size: approximately 500x380px, PNG with transparent or dark bg
          */}
          <div className="relative">
            <div className="relative rounded-2xl border border-white/10 bg-[#111614] overflow-hidden shadow-2xl">
              {/* Floating top bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/5" />
                  <div className="w-8 h-1.5 rounded-full bg-white/10" />
                </div>
              </div>

              {/* Scan visualization */}
              <div className="relative flex items-center justify-center py-12 px-8">
                {/* Animated scan ring — pure CSS */}
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-2xl border border-[#2dd4bf]/30" />
                  <div className="absolute inset-3 rounded-xl border border-[#2dd4bf]/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Eye size={32} className="text-[#2dd4bf]" />
                  </div>
                  {/* Scan line sweep animation */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="scan-sweep" />
                  </div>
                </div>

                {/* Side text lines */}
                <div className="absolute left-4 space-y-2">
                  <div className="w-20 h-1 rounded-full bg-white/5" />
                  <div className="w-14 h-1 rounded-full bg-white/5" />
                  <div className="w-18 h-1 rounded-full bg-white/5" />
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#0d1210] border-t border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2dd4bf]/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="text-xs font-medium text-white/80">STATUS</div>
                  <div className="text-xs text-[#2dd4bf]">Analysing Surface...</div>
                </div>
              </div>
            </div>

            {/* Glow behind mockup */}
            <div className="absolute -inset-4 bg-[#2dd4bf]/5 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>

        {/* RGB scan line divider */}
        <div className="absolute bottom-0 inset-x-0 h-px rgb-line" />
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-[#0d1210]">
        <div className="max-w-4xl mx-auto px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Upload size={14} />, label: "Fundus Image Analysis" },
            { icon: <Camera size={14} />, label: "Live Camera Scan" },
            { icon: <FileText size={14} />, label: "Triage Classification" },
            { icon: <ArrowRight size={14} />, label: "Structured Next Steps" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-white/40">
              <span className="text-[#2dd4bf]">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Three inputs. <span className="text-[#2dd4bf]">One structured result.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Describe",
                desc: "Our AI-driven chat captures symptoms, medical history, and onset speed using natural clinical logic.",
                /* ⚠️ IMAGE: Small screenshot of chat interface showing a symptom question */
              },
              {
                num: "02",
                title: "Show",
                desc: "Upload professional fundus images or use your smartphone camera for a directed macro scan of the eye exterior.",
                /* ⚠️ IMAGE: Screenshot of image upload/preview area */
              },
              {
                num: "03",
                title: "Act",
                desc: "Receive a categorized triage report: Low, Moderate, or Urgent, with data-backed reasoning for clinical review.",
                /* ⚠️ IMAGE: Screenshot of triage result card */
              },
            ].map((step, i) => (
              <div
                key={i}
                className="relative p-6 rounded-xl border border-white/5 bg-[#0f1410] hover:border-[#2dd4bf]/20 transition-all group"
              >
                <div className="text-5xl font-bold text-white/5 leading-none mb-4 group-hover:text-white/10 transition-colors">
                  {step.num}
                </div>
                <div className="w-6 h-6 rounded-md bg-[#2dd4bf]/10 flex items-center justify-center mb-3">
                  <div className="w-2 h-2 rounded-sm bg-[#2dd4bf]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ──────────────────────────────────── */}
      <FeaturesBento />

      {/* ── CLINICAL TRUST ──────────────────────────────────── */}
      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl font-bold mb-12"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Designed for guidance. <span className="text-[#ef4444]">Not diagnosis.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Shield size={20} className="text-[#2dd4bf]" />,
                title: "Clinical Calibration",
                desc: "Trained on 500,000+ validated clinical images via specialist-led frameworks.",
              },
              {
                icon: <Lock size={20} className="text-[#2dd4bf]" />,
                title: "Zero-Knowledge Security",
                desc: "All processing is encrypted. Images are only stored if you explicitly request a backup.",
              },
              {
                icon: <Users size={20} className="text-[#2dd4bf]" />,
                title: "Specialist Network",
                desc: "Instantly export your triage report to any clinic in our professional network.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                {item.icon}
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/20 max-w-xl mx-auto leading-relaxed">
            DISCLAIMER: Chakshu Mitra IS A PRE-SCREENING TRIAGE TOOL — IT DOES NOT PROVIDE MEDICAL DIAGNOSES. ALWAYS CONSULT A LICENSED CLINICIAN WITH ANY MEDICAL CONCERNS.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-32 px-8 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-[#2dd4bf]/3 blur-3xl" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-8 relative">
          Start your first assessment.
        </h2>
        <Link
          href="/app/chat"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#2dd4bf] text-[#0a0f0e] font-semibold rounded-md hover:bg-[#14b8a6] transition-all hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] text-sm"
        >
          Launch Triage Engine
        </Link>
        <p className="mt-4 text-xs text-white/30">No account required for initial screening.</p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-8 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <OcuLogo />
              <span className="font-semibold text-sm">Chakshu Mitra</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              High-fidelity clinical precision tools for the modern eye-care professional.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Documentation</div>
            <ul className="space-y-2 text-xs text-white/30">
              <li><a href="#" className="hover:text-white transition-colors">Clinical Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Regulatory Compliance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integration API</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Legal</div>
            <ul className="space-y-2 text-xs text-white/30">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Access</a></li>
              <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
            </ul>
          </div>

          <div className="text-xs text-white/20">
            <p>© 2026 Chakshu Mitra PRIVACY GROUP. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

    </main>
  );
}

function OcuLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Chakshu Mitra logo">
      <circle cx="12" cy="12" r="10" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.3" />
      <circle cx="12" cy="12" r="6" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.6" />
      <circle cx="12" cy="12" r="2.5" fill="#2dd4bf" />
    </svg>
  );
}