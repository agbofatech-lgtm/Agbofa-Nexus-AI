import React from "react";

export interface ButtonComponentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  "data-testid"?: string;
}

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonComponentProps) {
  let variantStyles =
    "bg-[#1E40AF] text-white hover:bg-[#1E3A8A] border-transparent";
  if (variant === "secondary") {
    variantStyles =
      "bg-[#475569] text-white hover:bg-slate-700 border-transparent";
  } else if (variant === "danger") {
    variantStyles =
      "bg-[#DC2626] text-white hover:bg-red-700 border-transparent";
  } else if (variant === "ghost") {
    variantStyles =
      "bg-transparent text-[#0F172A] hover:bg-slate-100 border-transparent";
  }

  return (
    <button
      type={props.type || "button"}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${className}`}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
