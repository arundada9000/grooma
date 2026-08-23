"use client";

import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type Align = "start" | "center" | "end";

type TriggerAttributes = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "dialog";
};

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
  /** A single interactive element, typically Button or IconButton. */
  trigger: ReactElement<TriggerAttributes>;
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

  const triggerWithProps = cloneElement(trigger, {
    onClick(event) {
      trigger.props.onClick?.(event);
      setOpen((current) => !current);
    },
    "aria-expanded": open,
    "aria-haspopup": "dialog",
  });

  return (
    <div ref={rootRef} className="relative inline-flex">
      {triggerWithProps}
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
