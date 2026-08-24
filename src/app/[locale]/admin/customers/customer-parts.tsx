"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/sheet";

/** Customer list card (server rendered as drawer trigger content). */
export function CustomerCard({
  name,
  phone,
  visitsLabel,
  lastSeenLabel,
}: {
  name: string;
  phone: string;
  visitsLabel: string;
  lastSeenLabel: string | null;
}) {
  return (
    <div className="ring-separator bg-card hover:bg-inset flex items-center gap-3 rounded-2xl p-3.5 text-left ring-1 transition-colors">
      <span
        aria-hidden="true"
        className="bg-accent-soft text-accent ring-accent/20 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1"
      >
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label truncate text-[15px] font-medium">{name}</p>
        <p className="text-label-secondary truncate text-[13px] tabular-nums">{phone}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-label-secondary text-[13px] font-medium">{visitsLabel}</p>
        {lastSeenLabel ? <p className="text-label-tertiary text-[12px]">{lastSeenLabel}</p> : null}
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * History drawer wrapping the Sheet primitive; children render inside
 * as server content passed through the client boundary.
 */
export function CustomerHistoryDrawer({
  customerName,
  customerPhone,
  historyTitle,
  emptyLabel,
  trigger,
  children,
}: {
  customerName: string;
  customerPhone: string;
  historyTitle: string;
  emptyLabel: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hasContent = children !== null && children !== undefined && children !== false;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full text-left",
          "focus-visible:outline-accent rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2",
        )}
      >
        {trigger}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${historyTitle} · ${customerName}`}>
        <div>
          <p className="text-label-secondary text-sm tabular-nums">{customerPhone}</p>
          <h3 className="text-label mt-3 text-[15px] font-semibold">{historyTitle}</h3>
          <div className="mt-2 max-h-[50vh] overflow-y-auto pb-2">
            {hasContent ? (
              children
            ) : (
              <p className="text-label-tertiary py-4 text-sm">{emptyLabel}</p>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
}
