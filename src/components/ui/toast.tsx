"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/components/ui/use-mounted";

export type ToastVariant = "default" | "success" | "error";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Defaults to 4000ms. Pass Infinity to keep it until dismissed. */
  durationMs?: number;
};

type ToastEntry = ToastInput & { id: number };

const ToastContext = createContext<{ push: (toast: ToastInput) => void } | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const mounted = useMounted();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId++;
      setToasts((current) => [...current.slice(-2), { ...input, id }]);
      if (input.durationMs !== Infinity) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), input.durationMs ?? 4000),
        );
      }
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        clearTimeout(timer);
      }
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              className="pt-safe pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-3"
            >
              {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastEntry; onDismiss: () => void }) {
  return (
    <div className="animate-toast-in bg-card/95 shadow-elevated ring-separator pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 ring-1 backdrop-blur-sm">
      <span className="mt-0.5 shrink-0 [&_svg]:size-5">
        <ToastIcon variant={toast.variant} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label text-sm font-medium">{toast.title}</p>
        {toast.description ? (
          <p className="text-label-secondary mt-0.5 text-[13px]">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="text-label-tertiary hover:text-label focus-visible:outline-accent -mt-1 -mr-1 shrink-0 rounded-full p-1.5 transition-colors focus-visible:outline-2"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
          <path
            d="m5 5 10 10M15 5 5 15"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ variant }: { variant?: ToastVariant }) {
  switch (variant) {
    case "success":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="text-success">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="m8 12.5 2.5 2.5L16 9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="text-destructive">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v6m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className="text-accent">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

/** Access the toast queue. Must be used inside ToastProvider. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
