"use client";

import { cn } from "@/lib/cn";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: {
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("bg-inset flex rounded-[10px] p-[2px]", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            onKeyDown={onArrowKeyNavigation}
            className={cn(
              "h-8 flex-1 rounded-[8px] px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150",
              "focus-visible:outline-accent focus-visible:outline-2 focus-visible:-outline-offset-2",
              selected ? "bg-card text-label shadow-card" : "text-label-secondary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function onArrowKeyNavigation(event: React.KeyboardEvent<HTMLButtonElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }
  const group = event.currentTarget.closest('[role="radiogroup"]');
  if (!group) {
    return;
  }
  const radios = Array.from(
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'),
  );
  const currentIndex = radios.indexOf(event.currentTarget);
  if (currentIndex === -1) {
    return;
  }
  event.preventDefault();
  const delta = event.key === "ArrowRight" ? 1 : -1;
  const next = radios[(currentIndex + delta + radios.length) % radios.length];
  next.focus();
  next.click();
}
