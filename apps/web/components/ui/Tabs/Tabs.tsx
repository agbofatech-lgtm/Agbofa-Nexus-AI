"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  ariaLabel = "Content sections",
}: TabsProps) {
  const baseId = useId();
  const firstEnabledValue = items.find((item) => !item.disabled)?.value ?? "";
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? firstEnabledValue,
  );
  const activeValue = value ?? internalValue;
  const activeItem = items.find((item) => item.value === activeValue);

  const selectTab = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentValue: string,
  ) => {
    const enabled = items.filter((item) => !item.disabled);
    const currentIndex = enabled.findIndex(
      (item) => item.value === currentValue,
    );
    if (currentIndex < 0) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % enabled.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = enabled.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextItem = enabled[nextIndex];
    if (!nextItem) return;
    selectTab(nextItem.value);
    document.getElementById(`${baseId}-tab-${nextItem.value}`)?.focus();
  };

  return (
    <div className={cn("nexus-tabs", className)}>
      <div aria-label={ariaLabel} className="nexus-tabs__list" role="tablist">
        {items.map((item) => {
          const selected = item.value === activeValue;
          return (
            <button
              key={item.value}
              aria-controls={`${baseId}-panel-${item.value}`}
              aria-selected={selected}
              className="nexus-tabs__trigger"
              disabled={item.disabled}
              id={`${baseId}-tab-${item.value}`}
              onClick={() => selectTab(item.value)}
              onKeyDown={(event) => onKeyDown(event, item.value)}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem ? (
        <div
          aria-labelledby={`${baseId}-tab-${activeItem.value}`}
          className="nexus-tabs__panel"
          id={`${baseId}-panel-${activeItem.value}`}
          role="tabpanel"
          tabIndex={0}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
