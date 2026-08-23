import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "bg-inset text-label h-11 w-full appearance-none rounded-xl border-0 pr-9 pl-3.5 text-[15px]",
          "transition-[box-shadow,background-color] duration-150 outline-none",
          "focus-visible:bg-card focus-visible:ring-accent/60 focus-visible:ring-2",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="text-label-tertiary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      >
        <path
          d="m5 7.5 5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
