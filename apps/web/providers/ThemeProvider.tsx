"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ResolvedTheme, Theme, ThemeContextValue } from "@/types/theme";

const STORAGE_KEY = "agbofa-nexus-theme";
const THEMES: readonly Theme[] = ["dark", "light", "system"];

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value !== null && THEMES.includes(value as Theme);
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : "dark";
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [mounted, setMounted] = useState(false);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onPreferenceChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "light" : "dark");
    };

    media.addEventListener("change", onPreferenceChange);
    return () => media.removeEventListener("change", onPreferenceChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    root.classList.remove("dark", "light");
    root.classList.add(resolvedTheme);
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    const timer = window.setTimeout(
      () => root.classList.remove("theme-transitioning"),
      320,
    );

    return () => window.clearTimeout(timer);
  }, [resolvedTheme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme, mounted }),
    [theme, resolvedTheme, setTheme, toggleTheme, mounted],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
