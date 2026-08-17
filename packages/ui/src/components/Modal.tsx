import React, { useEffect } from "react";

export interface ModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  ...props
}: ModalComponentProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        className={`bg-[#FFFFFF] rounded-lg shadow-xl max-w-lg w-full overflow-hidden ${className}`}
        {...props}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="modal-title" className="text-base font-semibold text-[#0F172A]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] text-sm font-bold p-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="p-6 text-sm text-[#0F172A]">{children}</div>
      </div>
    </div>
  );
}
