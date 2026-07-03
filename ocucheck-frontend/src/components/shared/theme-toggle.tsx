"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg",
        "text-text-muted hover:text-text hover:bg-surface-offset",
        "transition-all duration-150 ease-interactive",
        "focus-visible:outline-2 focus-visible:outline-primary",
        className
      )}
    >
      {theme === "dark" ? (
        <Sun size={17} strokeWidth={1.8} />
      ) : (
        <Moon size={17} strokeWidth={1.8} />
      )}
    </button>
  );
}