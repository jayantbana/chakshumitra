"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Upload,
  Video,
  FileText,
  History,
  PlusCircle,
  Menu,
  X,
  ChevronLeft,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/shared/app-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useSessionStore } from "@/store/session-store";
import { ROUTES } from "@/lib/constants/routes";

// ─── Nav structure with section groupings ─────────────────
const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { label: "New assessment", href: ROUTES.workspace, icon: PlusCircle, panel: "dashboard" as const, exact: true },
      { label: "Chat",           href: ROUTES.workspace, icon: MessageSquare, panel: "chat" as const, exact: true },
      { label: "Upload image",   href: ROUTES.workspace, icon: Upload, panel: "upload" as const, exact: true },
    ],
  },
  {
    label: "Scan",
    items: [
      { label: "Live scan",   href: ROUTES.live,      icon: Video },
      { label: "Assessment",  href: ROUTES.workspace, icon: FileText, panel: "dashboard" as const, exact: true },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "History", href: ROUTES.history, icon: History },
    ],
  },
];

// Flat list for collapsed sidebar icon-only mode
const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

const TRIAGE_COLORS = {
  normal:    { dot: "bg-success",              label: "All clear",     text: "text-success",  badgeClass: "shadow-[0_0_8px_2px_oklch(0.65_0.2_140deg/0.5)] border-[oklch(0.65_0.2_140deg/0.4)]" },
  monitor:   { dot: "bg-warning",              label: "Monitor",       text: "text-warning",  badgeClass: "shadow-[0_0_8px_2px_oklch(0.7_0.18_55deg/0.5)] border-[oklch(0.7_0.18_55deg/0.4)]" },
  urgent:    { dot: "bg-error",                label: "Urgent",        text: "text-error",    badgeClass: "shadow-[0_0_8px_2px_oklch(0.65_0.2_25deg/0.5)] border-[oklch(0.65_0.2_25deg/0.4)]" },
  emergency: { dot: "bg-error animate-pulse",  label: "Emergency",     text: "text-error",    badgeClass: "shadow-[0_0_8px_2px_oklch(0.65_0.2_20deg/0.5)] border-[oklch(0.65_0.2_20deg/0.4)]" },
};

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { sidebarOpen, toggleSidebar, setActivePanel } = useWorkspaceStore();
  const { activeProtocol, triageStatus, reset } = useSessionStore();

  // Protocol activation banner state
  const [bannerProtocol, setBannerProtocol] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const prevProtocolRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeProtocol && activeProtocol !== prevProtocolRef.current) {
      // New protocol activated — show banner
      setBannerProtocol(activeProtocol);
      setShowBanner(true);
      // Auto-hide after 3.5s (0.5s delay + 3s visible + fade-out)
      const t = setTimeout(() => setShowBanner(false), 4000);
      prevProtocolRef.current = activeProtocol;
      return () => clearTimeout(t);
    }
    if (!activeProtocol) {
      prevProtocolRef.current = null;
    }
  }, [activeProtocol]);

  const triage = triageStatus ? TRIAGE_COLORS[triageStatus] : null;

  const handleNavClick = (item: (typeof ALL_ITEMS)[0]) => {
    if (item.label === "New assessment" || item.label === "Assessment") {
      reset();
    }
    if ("panel" in item && item.panel) setActivePanel(item.panel as "dashboard" | "chat" | "upload");
    setMobileSidebarOpen(false);
  };

  const isActive = (item: (typeof ALL_ITEMS)[0]) => {
    if ("exact" in item && item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
        <AppLogo size="sm" href={ROUTES.home} />
        <button
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-text-faint hover:text-text hover:bg-surface-offset transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Session status */}
      {(activeProtocol || triage) && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-surface-2 border border-border">
          {activeProtocol && (
            <p className="text-xs text-text-muted mb-1 truncate">
              Protocol:{" "}
              <span className="text-text font-medium">{activeProtocol}</span>
            </p>
          )}
          {triage && (
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", triage.dot)} />
              <span className={cn("text-xs font-medium", triage.text)}>
                {triage.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation — sectioned */}
      <nav
        aria-label="Workspace navigation"
        className="flex-1 overflow-y-auto px-2 py-3 space-y-4"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase text-text-faint">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      "nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm group",
                      active
                        ? "text-text bg-surface-offset"
                        : "text-text-muted hover:text-text hover:bg-surface-offset"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 inset-y-2 w-0.5 rounded-full rgb-line-thick" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        active ? "text-primary" : "text-text-faint group-hover:text-text-muted"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.label === "New assessment" && (
                      <span className="ml-auto text-xs text-text-faint">⌘N</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-border space-y-1">
        {activeProtocol && (
          <button
            onClick={reset}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error-highlight transition-colors"
          >
            <X size={15} strokeWidth={1.8} />
            <span>Clear session</span>
          </button>
        )}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-text-faint font-mono">v1.0</p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 bg-surface border-r border-border",
          "transition-[width] duration-200 ease-interactive overflow-hidden",
          sidebarOpen ? "w-60" : "w-14"
        )}
        aria-label="Workspace sidebar"
      >
        {sidebarOpen ? (
          <SidebarContent />
        ) : (
          /* Collapsed — icon-only sidebar */
          <div className="flex flex-col h-full py-3 px-2 items-center gap-1">
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-text-faint hover:text-text hover:bg-surface-offset transition-colors mb-2"
            >
              <Menu size={16} />
            </button>
            {ALL_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={`collapsed-${item.label}`}
                  href={item.href}
                  onClick={() => handleNavClick(item)}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "nav-item flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-text-faint hover:text-text hover:bg-surface-offset"
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                </Link>
              );
            })}
            <div className="mt-auto">
              <ThemeToggle />
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          aria-modal="true"
          role="dialog"
          aria-label="Workspace navigation"
        >
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-surface border-r border-border h-full">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex flex-col flex-shrink-0 relative z-40 bg-bg/80 backdrop-blur-sm">
          <header className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text hover:bg-surface-offset transition-colors"
            >
              <Menu size={18} />
            </button>
            <AppLogo size="sm" href={ROUTES.home} animate={false} />
            <div className="ml-auto flex items-center gap-2">
              {triage && (
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full border bg-surface", triage.text, triage.badgeClass)}>
                  {triage.label}
                </span>
              )}
              <ThemeToggle />
            </div>
          </header>
          <div className="rgb-line w-full" />
        </div>

        {/* Protocol activation banner — slides in from top */}
        {showBanner && bannerProtocol && (
          <div className="protocol-banner flex-shrink-0 flex items-center justify-center gap-3 px-5 py-2.5 bg-surface border-b border-border">
            <div className="flex items-center gap-2.5">
              <Eye size={14} className="text-primary flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text">
                {bannerProtocol} protocol activated
              </span>
              <span className="text-xs text-text-muted">— AI diagnostic mode engaged</span>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="ml-auto text-text-faint hover:text-text transition-colors"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Page content — single scroll region */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}