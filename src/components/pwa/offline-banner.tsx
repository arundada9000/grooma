"use client";

import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { useOnline } from "./use-online";

/**
 * Honest offline banner (spec 83). Rendered above booking and manage
 * mutations; callers also disable their submit buttons while offline
 * so a booking can never silently fail or fake success.
 */
export function OfflineBanner({ className }: { className?: string }) {
  const online = useOnline();
  const t = useT();
  if (online) return null;
  return (
    <p
      role="status"
      className={cn(
        "text-warning bg-warning/10 ring-warning/30 rounded-2xl px-4 py-3 text-sm font-medium ring-1",
        className,
      )}
    >
      {t("pwa.offlineBanner")}
    </p>
  );
}
