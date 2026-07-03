import Link from "next/link";
import { AppLogo } from "@/components/shared/app-logo";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const FOOTER_COLS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: ROUTES.howItWorks },
      { label: "Supported conditions", href: "/#conditions" },
      { label: "Start assessment", href: ROUTES.workspace },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: ROUTES.about },
      { label: "Privacy policy", href: ROUTES.privacy },
      
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer
      className="border-t border-border bg-surface-offset"
      aria-label="Site footer"
    >
      {/* Main footer */}
      <div className="max-w-[var(--content-wide)] mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-4 max-w-sm">
            <AppLogo size="md" href={ROUTES.home} />
            <p className="text-sm text-text-muted leading-relaxed">
              Structured AI guidance for common eye conditions — from symptom
              description and image analysis to live diagnostic workflows.
            </p>
            {/* Medical disclaimer badge */}
            <div className="inline-flex items-start gap-2 mt-1 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
              <span className="text-warning mt-px flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <p className="text-xs text-warning/90 leading-snug">
                Not a substitute for professional medical advice. Always consult
                a qualified eye care professional for diagnosis.
              </p>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-text-faint">
                {col.heading}
              </h3>
              <ul role="list" className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm text-text-muted",
                        "hover:text-text transition-colors duration-150",
                        "focus-visible:text-primary"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-[var(--content-wide)] mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-faint">
            © {new Date().getFullYear()} Chakshu Mitra. All rights reserved.
          </p>
          <p className="text-xs text-text-faint">
            Built with AI-assisted diagnostic workflows
          </p>
        </div>
      </div>
    </footer>
  );
}