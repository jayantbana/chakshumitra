"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  animate?: boolean;
}

export function AppLogo({ className, size = "md", href = "/", animate = true }: AppLogoProps) {
  const sizes = { sm: 24, md: 28, lg: 36 };
  const px = sizes[size];
  const [irisAnimated, setIrisAnimated] = useState(false);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setIrisAnimated(true), 200);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const logo = (
    <span className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Eye motif — iris animates on page load */}
      <span className="relative flex items-center justify-center">
        <svg
          width={px}
          height={px}
          viewBox="0 0 32 32"
          fill="none"
          aria-label="Chakshu Mitra logo"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
          {/* Eye shape */}
          <path
            d="M6 16C6 16 10 9 16 9C22 9 26 16 26 16C26 16 22 23 16 23C10 23 6 16 6 16Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Iris ring */}
          <circle
            cx="16"
            cy="16"
            r="4"
            stroke="currentColor"
            strokeWidth="1.8"
            fill="none"
            className={irisAnimated ? "animate-eye-iris" : ""}
            style={{ transformOrigin: "16px 16px" }}
          />
          {/* Pupil */}
          <circle
            cx="16"
            cy="16"
            r="1.5"
            fill="currentColor"
            className={irisAnimated ? "animate-eye-iris" : ""}
            style={{ transformOrigin: "16px 16px", animationDelay: "0.05s" }}
          />
          {/* Teal scan arc */}
          <path
            d="M22 8 A10 10 0 0 1 28 16"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span
        className="font-display font-semibold tracking-tight text-text"
        style={{
          fontSize: size === "sm" ? "0.95rem" : size === "md" ? "1.1rem" : "1.35rem",
        }}
      >
        Ocu<span className="text-primary">Check</span>
      </span>
    </span>
  );

  if (href) {
    return <Link href={href}>{logo}</Link>;
  }
  return logo;
}

/* ─── EyeSpinner — used as AI processing indicator ─── */
interface EyeSpinnerProps {
  size?: number;
  className?: string;
}

export function EyeSpinner({ size = 48, className }: EyeSpinnerProps) {
  const half = size / 2;
  const r = half - 2;
  const irisR = size * 0.28;
  const pupilR = size * 0.1;
  const arcPath = `M ${half + r * Math.cos(-0.5)} ${half + r * Math.sin(-0.5)} A ${r} ${r} 0 0 1 ${half + r * Math.cos(0.9)} ${half + r * Math.sin(0.9)}`;

  return (
    <span
      className={cn("inline-flex items-center justify-center relative", className)}
      style={{ width: size, height: size }}
      aria-label="Processing…"
      role="status"
    >
      {/* Spinning outer arc */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        className="absolute inset-0 animate-eye-spin"
        style={{ transformOrigin: `${half}px ${half}px` }}
      >
        <circle
          cx={half}
          cy={half}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeOpacity="0.15"
        />
        <path
          d={arcPath}
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Static eye */}
      <svg
        width={size * 0.68}
        height={size * 0.68}
        viewBox="0 0 32 32"
        fill="none"
        className="relative z-10"
      >
        <path
          d="M4 16C4 16 9 8 16 8C23 8 28 16 28 16C28 16 23 24 16 24C9 24 4 16 4 16Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
          opacity="0.5"
        />
        <circle cx="16" cy="16" r="5" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" className="animate-eye-iris" style={{ transformOrigin: "16px 16px" }} />
        <circle cx="16" cy="16" r="2" fill="var(--color-primary)" className="animate-eye-iris" style={{ transformOrigin: "16px 16px", animationDelay: "0.05s" }} />
      </svg>
    </span>
  );
}