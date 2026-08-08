/**
 * Agbofa Nexus AI — Design System Tokens & UI Component Primitives (IMP-014, SVC-168, SVC-169)
 * Authoritative design tokens and accessible component interfaces.
 */

export const DesignTokens = {
  colors: {
    primary: "#1E40AF",
    primaryHover: "#1E3A8A",
    secondary: "#475569",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    error: "#DC2626",
    success: "#16A34A",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  radii: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    full: "9999px",
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: {
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
  },
};

export interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "error";
}

export interface InputProps {
  name: string;
  value: string;
  onChange: (val: string) => void;
  label: string;
  errorMessage?: string;
  required?: boolean;
}

export interface CardProps {
  title: string;
  summary: string;
  footer?: string;
}

export interface AlertProps {
  type: "info" | "success" | "error";
  message: string;
}

export interface LoadingStateProps {
  message?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
}

export interface ErrorStateProps {
  errorCode: string;
  message: string;
  onRetry?: () => void;
}

export interface BadgeProps {
  label: string;
  status: "success" | "warning" | "error" | "info";
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}

export function renderAccessibleAlert(props: AlertProps): { role: string; "aria-live": string; text: string } {
  return {
    role: "alert",
    "aria-live": props.type === "error" ? "assertive" : "polite",
    text: `[${props.type.toUpperCase()}] ${props.message}`,
  };
}
