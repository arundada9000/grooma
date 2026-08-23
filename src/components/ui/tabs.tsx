"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function TabsList({
  "aria-label": ariaLabel,
  children,
  className,
}: {
  "aria-label": string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("border-separator flex items-stretch gap-1 border-b", className)}
    >
      {children}
    </div>
  );
}

export function Tab({
  selected,
  onSelected,
  children,
  className,
}: {
  selected: boolean;
  onSelected: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? undefined : -1}
      onClick={onSelected}
      onKeyDown={onTabArrowNavigation}
      className={cn(
        "-mb-px border-b-2 px-3 pt-1.5 pb-2 text-sm whitespace-nowrap transition-colors duration-150",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:-outline-offset-4",
        selected
          ? "border-accent text-label font-semibold"
          : "text-label-secondary hover:text-label border-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}

/** Roving focus across sibling tabs with arrow keys, Home and End. */
function onTabArrowNavigation(event: React.KeyboardEvent<HTMLButtonElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) {
    return;
  }
  const list = event.currentTarget.closest('[role="tablist"]');
  if (!list) {
    return;
  }
  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const currentIndex = tabs.indexOf(event.currentTarget);
  if (currentIndex === -1) {
    return;
  }
  event.preventDefault();
  let nextIndex: number;
  switch (event.key) {
    case "ArrowLeft":
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case "ArrowRight":
      nextIndex = (currentIndex + 1) % tabs.length;
      break;
    case "Home":
      nextIndex = 0;
      break;
    default:
      nextIndex = tabs.length - 1;
  }
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}
