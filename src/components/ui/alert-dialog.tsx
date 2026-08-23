"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/ui/use-mounted";

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open) {
      return;
    }
    const opener = document.activeElement as HTMLElement | null;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onClose}
        className="animate-fade-in bg-backdrop absolute inset-0"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        autoFocus
        className="animate-scale-in bg-card shadow-elevated relative w-full max-w-xs rounded-3xl p-5 text-center outline-none"
      >
        <h2 className="text-label text-[17px] font-semibold">{title}</h2>
        {description ? <p className="text-label-secondary mt-1.5 text-sm">{description}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="tonal" className="bg-inset text-label" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "filled"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
