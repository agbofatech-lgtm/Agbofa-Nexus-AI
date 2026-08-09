import React from "react";

export interface CardComponentProps {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function Card({
  title,
  footer,
  children,
  className = "",
  ...props
}: CardComponentProps) {
  return (
    <div
      className={`bg-[#FFFFFF] border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-[#0F172A] text-base">
          {title}
        </div>
      )}
      <div className="px-6 py-4 text-sm text-[#0F172A]">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-[#64748B]">
          {footer}
        </div>
      )}
    </div>
  );
}
