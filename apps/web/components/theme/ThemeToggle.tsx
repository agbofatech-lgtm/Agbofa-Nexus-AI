"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { mounted, resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      aria-label={label}
      className={cn("icon-button theme-toggle", className)}
      disabled={!mounted}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {mounted && !isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  );
}
