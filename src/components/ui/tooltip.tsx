"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tooltip({
  label,
  side = "top",
  children,
}: {
  label: string;
  side?: "top" | "bottom";
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
      }
    },
    [],
  );

  function show() {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
    }
    delayRef.current = setTimeout(() => setVisible(true), 300);
  }

  function hide() {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
    }
    setVisible(false);
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {visible ? (
        <span
          role="tooltip"
          className={cn(
            "animate-scale-in bg-label text-background shadow-elevated pointer-events-none absolute left-1/2 z-40 w-max max-w-56 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-center text-xs font-medium",
            side === "top" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top",
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
