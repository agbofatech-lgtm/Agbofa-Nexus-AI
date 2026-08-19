"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Check, Eye, EyeOff, Search, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "size" | "type" | "value"
> {
  type?: "text" | "password" | "email" | "search";
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      label,
      value,
      onChange,
      error,
      success,
      disabled = false,
      icon,
      required = false,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPassword = type === "password";
    const isSearch = type === "search";
    const effectiveType = isPassword && passwordVisible ? "text" : type;
    const leadingIcon = icon ?? (isSearch ? <Search size={17} /> : null);

    return (
      <div
        className={cn(
          "input-field",
          error && "input-field--error",
          success && !error && "input-field--success",
          disabled && "input-field--disabled",
          className,
        )}
      >
        {label ? (
          <label className="input-field__label" htmlFor={inputId}>
            {label}
            {required ? (
              <span aria-hidden="true" className="input-field__required">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="input-field__control">
          {leadingIcon ? (
            <span aria-hidden="true" className="input-field__leading-icon">
              {leadingIcon}
            </span>
          ) : null}
          <input
            {...props}
            ref={ref}
            aria-describedby={error || success ? messageId : undefined}
            aria-invalid={Boolean(error)}
            className="input-field__input"
            disabled={disabled}
            id={inputId}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            type={effectiveType}
            value={value}
          />

          {isSearch && value ? (
            <button
              aria-label="Clear search"
              className="input-field__action"
              disabled={disabled}
              onClick={() => onChange("")}
              type="button"
            >
              <X size={16} />
            </button>
          ) : null}

          {isPassword ? (
            <button
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className="input-field__action"
              disabled={disabled}
              onClick={() => setPasswordVisible((visible) => !visible)}
              type="button"
            >
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          ) : null}

          {success && !error && !isPassword && !isSearch ? (
            <Check
              aria-hidden="true"
              className="input-field__success-icon"
              size={17}
            />
          ) : null}
        </div>

        {error || success ? (
          <p
            className="input-field__message"
            id={messageId}
            role={error ? "alert" : "status"}
          >
            {error ?? success}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
