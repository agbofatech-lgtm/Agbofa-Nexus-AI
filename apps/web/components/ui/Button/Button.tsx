"use client";

import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

interface RippleState {
  x: number;
  y: number;
  size: number;
  key: number;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      className,
      children,
      onClick,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const [ripple, setRipple] = useState<RippleState | null>(null);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const sizePx = Math.max(rect.width, rect.height) * 1.8;
      const hasPointerCoordinates = event.clientX !== 0 || event.clientY !== 0;
      const x = hasPointerCoordinates
        ? event.clientX - rect.left - sizePx / 2
        : rect.width / 2 - sizePx / 2;
      const y = hasPointerCoordinates
        ? event.clientY - rect.top - sizePx / 2
        : rect.height / 2 - sizePx / 2;

      setRipple({ x, y, size: sizePx, key: Date.now() });
      window.setTimeout(() => setRipple(null), 620);
      onClick?.(event);
    };

    return (
      <button
        {...props}
        ref={ref}
        aria-busy={loading || undefined}
        className={cn(
          "nexus-button",
          `nexus-button--${variant}`,
          `nexus-button--${size}`,
          className,
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        type={type}
      >
        {ripple ? (
          <span
            key={ripple.key}
            aria-hidden="true"
            className="nexus-button__ripple"
            style={{
              height: ripple.size,
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
            }}
          />
        ) : null}
        <span className="nexus-button__content">
          {loading ? (
            <span aria-hidden="true" className="button-spinner" />
          ) : null}
          <span>{children}</span>
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
