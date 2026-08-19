"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  label?: string;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      onValueChange,
      className,
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div
        className={cn(
          "select-field",
          error && "select-field--error",
          className,
        )}
      >
        {label ? (
          <label className="select-field__label" htmlFor={selectId}>
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </label>
        ) : null}
        <div className="select-field__control">
          <select
            {...props}
            ref={ref}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            className="select-field__select"
            id={selectId}
            onChange={(event) => onValueChange?.(event.target.value)}
            required={required}
          >
            {placeholder ? (
              <option disabled value="">
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                key={option.value}
                disabled={option.disabled}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="select-field__icon"
            size={17}
          />
        </div>
        {error ? (
          <p className="select-field__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
