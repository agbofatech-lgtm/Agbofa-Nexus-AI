"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { callRpc } from "../../lib/bff/client";

export interface AuthenticateUserRequest {
  tenant_name: string;
  principal_name: string;
  credential: string;
}

export interface AuthenticationTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface TokenClaims {
  subject: string;
  tenant_id: string;
  roles: string[];
  issuer?: string;
  audience?: string[];
  token_id?: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface SessionContextType {
  status: AuthStatus;
  session: TokenClaims | null;
  error: string | null;
  login: (tenantName: string, principalName: string, credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextType>({
  status: "loading",
  session: null,
  error: null,
  login: async () => false,
  logout: async () => {},
  refreshSession: async () => false,
  clearError: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<TokenClaims | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateSession = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await callRpc<Record<string, never>, TokenClaims>(
        "foundation.v1.TenantIdentityService",
        "ValidateToken",
        {},
      );

      if (response.status === "SUCCESS" && response.data) {
        setSession(response.data);
        setStatus("authenticated");
        setError(null);
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = useCallback(
    async (tenantName: string, principalName: string, credential: string): Promise<boolean> => {
      setStatus("loading");
      setError(null);

      const requestPayload: AuthenticateUserRequest = {
        tenant_name: tenantName,
        principal_name: principalName,
        credential,
      };

      try {
        const response = await callRpc<AuthenticateUserRequest, TokenClaims>(
          "foundation.v1.TenantIdentityService",
          "AuthenticateUser",
          requestPayload,
        );

        if (response.status === "SUCCESS" && response.data) {
          // Use REAL backend claims. No fabricated roles, no client-generated token IDs.
          setSession(response.data);
          setStatus("authenticated");
          setError(null);
          return true;
        }

        const errorMessage =
          response.error?.message || "Authentication failed: invalid credentials or tenant suspended";
        setError(errorMessage);
        setStatus("unauthenticated");
        setSession(null);
        return false;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error during authentication";
        setError(message);
        setStatus("unauthenticated");
        setSession(null);
        return false;
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await callRpc<Record<string, never>, Record<string, never>>(
        "foundation.v1.TenantIdentityService",
        "ValidateToken",
        { logout: true } as never,
      );
    } catch {
      // Ignore network errors during logout
    } finally {
      setSession(null);
      setStatus("unauthenticated");
      setError(null);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await callRpc<Record<string, never>, AuthenticationTokens>(
        "foundation.v1.TenantIdentityService",
        "RefreshToken",
        {},
      );
      if (response.status === "SUCCESS") {
        await validateSession();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [validateSession]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      status,
      session,
      error,
      login,
      logout,
      refreshSession,
      clearError,
    }),
    [status, session, error, login, logout, refreshSession, clearError],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextType {
  return useContext(SessionContext);
}