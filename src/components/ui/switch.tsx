"use client";

import { cn } from "@/lib/cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name for the control. */
  label: string;
  disabled?: boolean;
};

const THUMB_TRAVEL = 20;

/** iOS style toggle switch. */
export function Switch({ checked, onCheckedChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ease-out",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        "active:opacity-80 disabled:opacity-50",
        checked ? "bg-success" : "bg-inset",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "shadow-elevated absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white",
          "ease-spring transition-transform duration-200 dark:bg-neutral-100",
        )}
        style={{ transform: `translateX(${checked ? THUMB_TRAVEL : 0}px)` }}
      />
    </button>
  );
}
