"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/shared/app-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROUTES } from "@/lib/constants/routes";

const NAV_LINKS = [
  { label: "How it works", href: ROUTES.howItWorks },
  { label: "Conditions", href: "/#conditions" },
  { label: "About", href: ROUTES.about },
];

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-200",
          scrolled
            ? "bg-bg/90 backdrop-blur-md border-b border-border/60 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-[var(--content-wide)] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <AppLogo href={ROUTES.home} size="md" />

            {/* Desktop nav */}
            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center gap-1"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                    "text-text-muted hover:text-text hover:bg-surface-offset",
                    pathname === link.href && "text-text bg-surface-offset"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:flex" />

              {/* CTA */}
              <Link
                href={ROUTES.workspace}
                className={cn(
                  "hidden md:flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-text-inverse text-sm font-medium",
                  "hover:bg-primary-hover active:bg-primary-active",
                  "transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                )}
              >
                Start assessment
                <ArrowRight size={14} strokeWidth={2} />
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className={cn(
                  "md:hidden flex items-center justify-center w-9 h-9 rounded-lg",
                  "text-text-muted hover:text-text hover:bg-surface-offset",
                  "transition-colors duration-150"
                )}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-200",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-bg/60 backdrop-blur-sm transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-72 bg-surface shadow-lg",
            "border-l border-border transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-border">
            <AppLogo size="sm" href={ROUTES.home} />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-text hover:bg-surface-offset"
            >
              <X size={18} />
            </button>
          </div>

          <nav aria-label="Mobile navigation" className="flex flex-col px-3 py-4 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-text-muted hover:text-text hover:bg-surface-offset",
                  pathname === link.href && "text-text bg-surface-offset"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="px-4 mt-2 flex flex-col gap-3">
            <Link
              href={ROUTES.workspace}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
                "bg-primary text-text-inverse text-sm font-medium",
                "hover:bg-primary-hover transition-colors"
              )}
            >
              Start assessment
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="absolute bottom-6 left-4">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Spacer so content doesn't hide under fixed header */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}