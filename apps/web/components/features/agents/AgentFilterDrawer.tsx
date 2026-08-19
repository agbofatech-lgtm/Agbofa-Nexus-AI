"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";

import { AgentFilters } from "@/components/features/agents/AgentFilters";
import { Button } from "@/components/ui";
import { useAgentsStore } from "@/stores/agents-store";

interface AgentFilterDrawerProps {
  categoryLocked?: boolean;
}

export function AgentFilterDrawer({
  categoryLocked = false,
}: AgentFilterDrawerProps) {
  const open = useAgentsStore((state) => state.mobileFiltersOpen);
  const setOpen = useAgentsStore((state) => state.setMobileFiltersOpen);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        className="agent-filter-trigger"
        onClick={() => setOpen(true)}
        size="sm"
        variant="ghost"
      >
        <SlidersHorizontal size={14} /> Filter agents
      </Button>
      {open ? (
        <div
          className="agent-filter-backdrop"
          onMouseDown={() => setOpen(false)}
          role="presentation"
        >
          <div
            ref={drawerRef}
            aria-label="Agent filters"
            aria-modal="true"
            className="agent-filter-drawer glass-dark"
            onKeyDown={onKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div>
              <strong>Filter workforce</strong>
              <button
                data-autofocus
                aria-label="Close filters"
                className="icon-button"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <AgentFilters categoryLocked={categoryLocked} compact />
          </div>
        </div>
      ) : null}
    </>
  );
}
