"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Slot } from "@/lib/scheduling/types";
import { minuteOfDayToHHMM } from "@/lib/scheduling/format";
import type { Locale } from "@/i18n/config";
import type { BookingErrorCode } from "@/lib/booking/types";
import { cancelBookingAction, rescheduleBookingAction } from "@/lib/booking/actions";
import { SlotPicker, type SlotPickerLabels } from "@/components/book/slot-picker";

/**
 * Cancel and reschedule controls for a customer's own appointment.
 * Both go through the transactional core; a lost race refreshes slots
 * and keeps the customer in place.
 */

export interface ManageActionsProps {
  token: string;
  locale: Locale;
  chunks: string[][];
  serviceId: string;
  barberId: string;
  canModify: boolean;
  labels: {
    reschedule: string;
    pickNewTime: string;
    confirmReschedule: string;
    updating: string;
    cancelBooking: string;
    cancelConfirmTitle: string;
    cancelConfirmBody: string;
    keepIt: string;
    yesCancel: string;
    cancelling: string;
    picker: SlotPickerLabels;
    errorMessages: Record<BookingErrorCode | "generic", string>;
  };
}

export function ManageActions(props: ManageActionsProps) {
  const { token, locale, chunks, serviceId, barberId, canModify, labels } = props;
  const router = useRouter();

  const [mode, setMode] = useState<"idle" | "reschedule" | "cancel">("idle");
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  if (!canModify && mode === "idle") return null;

  async function runMutation(
    run: () => Promise<{ ok: boolean; code?: BookingErrorCode; detail?: string }>,
  ) {
    setBusy(true);
    setBanner(null);
    try {
      const result = await run();
      if (result.ok) {
        setMode("idle");
        router.refresh();
      } else {
        setBanner(labels.errorMessages[result.code ?? "generic"] ?? labels.errorMessages.generic);
        if (result.code === "SLOT_UNAVAILABLE") setRefreshSignal((s) => s + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      {banner ? (
        <p
          role="alert"
          className="bg-destructive-soft text-destructive mb-4 rounded-2xl p-4 text-sm font-medium"
        >
          {banner}
        </p>
      ) : null}

      {canModify ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode(mode === "reschedule" ? "idle" : "reschedule")}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-6 text-[15px] font-medium",
              "transition-transform duration-150 ease-out active:scale-[0.96]",
              mode === "reschedule" ? "bg-accent text-on-accent" : "bg-accent-soft text-accent",
            )}
          >
            {labels.reschedule}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "cancel" ? "idle" : "cancel")}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-6 text-[15px] font-medium",
              "transition-transform duration-150 ease-out active:scale-[0.96]",
              mode === "cancel"
                ? "bg-destructive text-on-destructive"
                : "border-separator text-destructive border",
            )}
          >
            {labels.cancelBooking}
          </button>
        </div>
      ) : null}

      {mode === "reschedule" ? (
        <div className="mt-6">
          <SlotPicker
            locale={locale}
            chunks={chunks}
            serviceId={serviceId}
            barberId={barberId}
            labels={labels.picker}
            selectedDateKey={dateKey}
            selectedStartMs={null}
            refreshSignal={refreshSignal}
            onDaySelect={(key) => setDateKey(key)}
            onSlotSelect={(slot: Slot) => {
              setDateKey(slot.dateKey);
              setStartMinute(slot.startMinute);
            }}
          />
          <button
            type="button"
            disabled={dateKey == null || startMinute == null || busy}
            onClick={() =>
              void runMutation(() =>
                rescheduleBookingAction({
                  token,
                  dateKey: dateKey as string,
                  time: minuteOfDayToHHMM(startMinute as number),
                }),
              )
            }
            className={cn(
              "bg-accent text-on-accent mt-5 inline-flex h-12 w-full items-center justify-center rounded-full text-base font-medium",
              "transition-transform duration-150 ease-out active:scale-[0.98]",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            {busy ? labels.updating : labels.confirmReschedule}
          </button>
        </div>
      ) : null}

      {mode === "cancel" ? (
        <div className="bg-destructive-soft mt-6 rounded-2xl p-4">
          <p className="text-label font-semibold">{labels.cancelConfirmTitle}</p>
          <p className="text-label-secondary mt-0.5 text-sm">{labels.cancelConfirmBody}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runMutation(() => cancelBookingAction({ token }))}
              className="bg-destructive text-on-destructive inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? labels.cancelling : labels.yesCancel}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-label-secondary hover:text-label inline-flex h-10 items-center px-4 text-sm font-medium transition-colors"
            >
              {labels.keepIt}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
