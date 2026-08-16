"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthContextValue,
  AuthSession,
  AuthStatus,
  LoginCredentials,
  SignInResult,
} from "@/types/auth";

const SESSION_KEY = "agbofa-nexus-demo-session";
const DEMO_TENANT = "agbofa";
const DEMO_ADMIN = "admin@agbofa.ai";
const DEMO_PASSWORD = "nexus-demo";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const MOCK_LATENCY_MS = 850;

export const AuthContext = createContext<AuthContextValue | null>(null);

function isStoredSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthSession>;
  return (
    typeof candidate.tenant === "string" &&
    typeof candidate.expiresAt === "string" &&
    typeof candidate.user?.id === "string" &&
    typeof candidate.user.name === "string" &&
    typeof candidate.user.email === "string" &&
    (candidate.user.role === "admin" ||
      candidate.user.role === "editor" ||
      candidate.user.role === "reader")
  );
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !isStoredSession(parsed) ||
      Date.parse(parsed.expiresAt) <= Date.now()
    ) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const storedSession = readStoredSession();
    setSession(storedSession);
    setStatus(storedSession ? "authenticated" : "unauthenticated");
  }, []);

  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<SignInResult> => {
      await wait(MOCK_LATENCY_MS);

      if (
        !window.navigator.onLine ||
        credentials.tenant.toLowerCase() === "offline"
      ) {
        return {
          success: false,
          code: "network_error",
          message: "Connection failed. Check your network and retry.",
        };
      }

      const validCredentials =
        credentials.tenant.trim().toLowerCase() === DEMO_TENANT &&
        credentials.admin.trim().toLowerCase() === DEMO_ADMIN &&
        credentials.password === DEMO_PASSWORD;

      if (!validCredentials) {
        return {
          success: false,
          code: "invalid_credentials",
          message:
            "Invalid credentials. Check your tenant, admin, and password.",
        };
      }

      const nextSession: AuthSession = {
        tenant: "Agbofa Media",
        user: {
          id: "demo-admin-001",
          name: "Kofi Agbofa",
          email: DEMO_ADMIN,
          role: "admin",
        },
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      };

      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setStatus("authenticated");
      return { success: true, session: nextSession };
    },
    [],
  );

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, status, signIn, signOut }),
    [session, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
