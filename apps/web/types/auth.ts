export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type UserRole = "admin" | "editor" | "reader";
export type AuthErrorCode = "invalid_credentials" | "network_error";

export interface LoginCredentials {
  tenant: string;
  admin: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  tenant: string;
  user: AuthUser;
  expiresAt: string;
}

export type SignInResult =
  | { success: true; session: AuthSession }
  | { success: false; code: AuthErrorCode; message: string };

export interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  signIn: (credentials: LoginCredentials) => Promise<SignInResult>;
  signOut: () => void;
}
