"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@/components/ui/icon-button";
import { useMounted } from "@/components/ui/use-mounted";

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open) {
      return;
    }
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in bg-backdrop absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        autoFocus
        className={cnSheetPanel()}
      >
        <div
          aria-hidden="true"
          className="bg-label-tertiary mx-auto mt-2 h-1 w-9 shrink-0 rounded-full sm:hidden"
        />
        <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
          <h2 className="text-label text-base font-semibold">{title}</h2>
          <IconButton aria-label="Close" onClick={onClose} size="sm">
            <svg viewBox="0 0 20 20" fill="none" className="size-4">
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer ? (
          <footer className="border-separator pb-safe border-t px-4 py-3">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function cnSheetPanel(): string {
  return [
    "relative flex max-h-[85dvh] w-full flex-col outline-none",
    "rounded-t-3xl bg-card shadow-elevated",
    "animate-slide-up sm:max-w-md sm:animate-scale-in sm:rounded-3xl",
  ].join(" ");
}
