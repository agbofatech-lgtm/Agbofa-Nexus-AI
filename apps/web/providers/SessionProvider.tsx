"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { csrfHeaders } from "@/lib/bff/csrf-client";
import type {
  AuthContextValue,
  AuthSession,
  AuthStatus,
  LoginCredentials,
  SignInResult,
} from "@/types/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/v1/auth/session", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setSession(null);
            setStatus(response.status === 401 ? "unauthenticated" : "unauthenticated");
          }
          return;
        }
        const body = (await response.json()) as {
          authenticated?: boolean;
          reason?: string;
          session?: AuthSession;
        };
        if (cancelled) return;
        if (body.authenticated && body.session) {
          setSession(body.session);
          setStatus("authenticated");
          return;
        }
        setSession(null);
        setStatus(body.reason === "expired" ? "expired" : "unauthenticated");
      } catch {
        if (!cancelled) {
          setSession(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<SignInResult> => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const body = (await response.json()) as SignInResult | { error?: string };
      if (!response.ok || !("success" in body) || !body.success) {
        return {
          success: false,
          code: response.status >= 500 ? "network_error" : "invalid_credentials",
          message:
            "success" in body && !body.success
              ? body.message
              : "Sign-in failed.",
        };
      }
      setSession(body.session);
      setStatus("authenticated");
      return body;
    } catch {
      return {
        success: false,
        code: "network_error",
        message: "Connection failed. Check your network and retry.",
      };
    }
  }, []);

  const signOut = useCallback(() => {
    void fetch("/api/v1/auth/logout", { method: "POST", headers: csrfHeaders() });
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, status, signIn, signOut }),
    [session, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
