"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Align = "start" | "center" | "end";

const ALIGN_CLASSES: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export function Popover({
  trigger,
  align = "start",
  children,
  triggerLabel,
}: {
  trigger: ReactNode;
  align?: Align;
  children: ReactNode;
  /** Accessible name for the popover panel. */
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="focus-visible:outline-accent inline-flex focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={triggerLabel}
          className={cn(
            "animate-scale-in bg-card shadow-elevated ring-separator absolute top-full z-40 mt-2 min-w-48 origin-top rounded-2xl p-2 ring-1",
            ALIGN_CLASSES[align],
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
