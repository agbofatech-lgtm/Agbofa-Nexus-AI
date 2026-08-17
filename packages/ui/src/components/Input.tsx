import React from "react";

export interface InputComponentProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorMessage?: string;
  required?: boolean;
  "data-testid"?: string;
}

export function Input({
  label,
  errorMessage,
  required = false,
  className = "",
  id,
  ...props
}: InputComponentProps) {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-[#0F172A]"
      >
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
        className={`w-full bg-[#FFFFFF] border rounded-md px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1E40AF] ${
          errorMessage ? "border-[#DC2626]" : "border-slate-300"
        } ${className}`}
        {...props}
      />
      {errorMessage && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-[#DC2626] font-medium"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
