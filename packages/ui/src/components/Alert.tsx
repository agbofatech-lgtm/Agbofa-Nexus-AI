import React from "react";

export interface AlertComponentProps {
  type: "info" | "success" | "warning" | "error";
  message: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function Alert({
  type,
  message,
  className = "",
  ...props
}: AlertComponentProps) {
  let styles = "bg-blue-50 text-[#1E40AF] border-blue-200";
  let role = "status";

  if (type === "success") {
    styles = "bg-green-50 text-[#16A34A] border-green-200";
  } else if (type === "warning") {
    styles = "bg-amber-50 text-amber-800 border-amber-200";
  } else if (type === "error") {
    styles = "bg-red-50 text-[#DC2626] border-red-200";
    role = "alert";
  }

  return (
    <div
      role={role}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`p-3 border rounded-md text-xs font-medium ${styles} ${className}`}
      {...props}
    >
      {message}
    </div>
  );
}
