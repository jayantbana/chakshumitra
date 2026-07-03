// src/components/layout/workspace-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus, MessageCircle, Upload, Camera,
  ClipboardList, History, Settings, User,
  LogOut, Eye, ChevronLeft
} from "lucide-react";

interface WorkspaceSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: "/app/chat",       icon: Plus,          label: "New Assessment", shortcut: "⌘N", section: "WORKSPACE" },
  { href: "/app/chat",       icon: MessageCircle, label: "Chat" },
  { href: "/app/upload",     icon: Upload,        label: "Upload image" },
  { href: "/app/live",       icon: Camera,        label: "Live scan" },
  { href: "/app/assessment", icon: ClipboardList, label: "Assessment" },
  { href: "/app/history",    icon: History,       label: "History" },
];

const prefItems = [
  { href: "/app/settings", icon: Settings, label: "Settings", section: "PREFERENCES" },
  { href: "/app/account",  icon: User,     label: "Account" },
];

export function WorkspaceSidebar({ collapsed, onToggle }: WorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-screen border-r transition-all duration-200 flex-shrink-0"
      style={{
        width: collapsed ? "60px" : "240px",
        background: "#14161a",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="w-6 h-6 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" aria-label="Chakshu Mitra">
            <circle cx="12" cy="12" r="9" stroke="#2dd4bf" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="4" stroke="#2dd4bf" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="1.5" fill="#2dd4bf"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm" style={{ color: "#f1f0ee" }}>
            Chakshu Mitra
          </span>
        )}
      </div>

      {/* RGB line */}
      <div className="rgb-line w-full" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
        {!collapsed && (
          <p className="text-xs font-semibold tracking-widest px-2 mb-2" style={{ color: "#4a4947" }}>
            WORKSPACE
          </p>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="nav-item relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: isActive ? "rgba(45,212,191,0.06)" : "transparent",
                color: isActive ? "#2dd4bf" : "#8b8a87",
              }}
            >
              {/* Active left indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full rgb-line-thick"
                  style={{ animationDuration: "3s" }}
                />
              )}
              <item.icon size={16} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs" style={{ color: "#4a4947" }}>
                      {item.shortcut}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {!collapsed && (
          <p className="text-xs font-semibold tracking-widest px-2 mt-4 mb-2" style={{ color: "#4a4947" }}>
            PREFERENCES
          </p>
        )}

        {prefItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: isActive ? "rgba(45,212,191,0.06)" : "transparent",
                color: isActive ? "#2dd4bf" : "#8b8a87",
              }}
            >
              <item.icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        {!collapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}
              >
                DR
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#f1f0ee" }}>
                  Dr. Aria Thorne
                </p>
                <p className="text-xs truncate" style={{ color: "#4a4947" }}>
                  OPHTHALMOLOGIST
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-full transition-colors hover:bg-white/5"
              style={{ color: "#8b8a87" }}
            >
              <LogOut size={13} />
              <span>SIGN OUT</span>
            </button>
          </div>
        ) : (
          <button
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5"
            style={{ color: "#8b8a87" }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:bg-surface-2 z-10"
        style={{
          background: "#14161a",
          borderColor: "rgba(255,255,255,0.15)",
          color: "#8b8a87",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={12}
          style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
        />
      </button>
    </aside>
  );
}