"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Slot } from "@/lib/scheduling/types";
import { minuteOfDayToHHMM } from "@/lib/scheduling/format";
import type { Locale } from "@/i18n/config";
import {
  rescheduleByStaffAction,
  setAppointmentStatusAction,
  updateAdminNotesAction,
} from "@/lib/admin/actions";
import { SlotPicker, type SlotPickerLabels } from "@/components/book/slot-picker";

export interface AppointmentActionsLabels {
  confirm: string;
  complete: string;
  cancelAction: string;
  noShow: string;
  cancelConfirmTitle: string;
  cancelConfirmBody: string;
  keepIt: string;
  yesCancel: string;
  cancelReasonLabel: string;
  reschedule: string;
  pickNewTime: string;
  confirmReschedule: string;
  updating: string;
  notes: string;
  notesPlaceholder: string;
  saveNotes: string;
  saved: string;
  errorGeneric: string;
  picker: SlotPickerLabels;
}

type ErrorCode = "NOT_FOUND" | "STATE_CONFLICT" | "SLOT_UNAVAILABLE" | "INVALID_INPUT";

export function AppointmentActions({
  appointmentId,
  locale,
  status,
  serviceId,
  barberId,
  chunks,
  labels,
}: {
  appointmentId: string;
  locale: Locale;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  serviceId: string;
  barberId: string;
  chunks: string[][];
  labels: AppointmentActionsLabels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startMinute, setStartMinute] = useState<number | null>(null);

  const active = status === "PENDING" || status === "CONFIRMED";

  async function run(key: string, run_: () => Promise<{ ok: boolean; code?: ErrorCode }>) {
    setBusy(key);
    setError(null);
    try {
      const result = await run_();
      if (!result.ok) {
        setError(labels.errorGeneric);
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6">
      {error ? (
        <p
          role="alert"
          className="bg-destructive-soft text-destructive mb-4 rounded-2xl p-3 text-sm font-medium"
        >
          {error}
        </p>
      ) : null}

      {active ? (
        <>
          <div className="flex flex-wrap gap-2">
            {status === "PENDING" ? (
              <ActionButton
                label={labels.confirm}
                tone="accent"
                busy={busy === "confirm"}
                onClick={() =>
                  void run("confirm", () =>
                    setAppointmentStatusAction({ appointmentId, action: "confirm" }),
                  )
                }
              />
            ) : null}
            <ActionButton
              label={labels.complete}
              tone="success"
              busy={busy === "complete"}
              onClick={() =>
                void run("complete", () =>
                  setAppointmentStatusAction({ appointmentId, action: "complete" }),
                )
              }
            />
            <ActionButton
              label={labels.noShow}
              tone="ghost"
              busy={busy === "noShow"}
              onClick={() =>
                void run("noShow", () =>
                  setAppointmentStatusAction({ appointmentId, action: "noShow" }),
                )
              }
            />
            <ActionButton
              label={labels.reschedule}
              tone="tonal"
              busy={false}
              selected={rescheduleOpen}
              onClick={() => setRescheduleOpen((open) => !open)}
            />
            <ActionButton
              label={labels.cancelAction}
              tone="destructive"
              busy={false}
              selected={cancelOpen}
              onClick={() => setCancelOpen((open) => !open)}
            />
          </div>

          {rescheduleOpen ? (
            <div className="mt-5">
              <SlotPicker
                locale={locale}
                chunks={chunks}
                serviceId={serviceId}
                barberId={barberId}
                labels={labels.picker}
                selectedDateKey={dateKey}
                selectedStartMs={null}
                onDaySelect={(key) => setDateKey(key)}
                onSlotSelect={(slot: Slot) => {
                  setDateKey(slot.dateKey);
                  setStartMinute(slot.startMinute);
                }}
              />
              <button
                type="button"
                disabled={dateKey == null || startMinute == null || busy != null}
                onClick={() =>
                  void run("move", () =>
                    rescheduleByStaffAction({
                      appointmentId,
                      dateKey: dateKey as string,
                      time: minuteOfDayToHHMM(startMinute as number),
                    }),
                  ).then((done) => {
                    if (done) setRescheduleOpen(false);
                  })
                }
                className={cn(
                  "bg-accent text-on-accent mt-4 inline-flex h-11 w-full items-center justify-center rounded-full text-[15px] font-medium",
                  "transition-transform duration-150 ease-out active:scale-[0.98]",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                {busy === "move" ? labels.updating : labels.confirmReschedule}
              </button>
            </div>
          ) : null}

          {cancelOpen ? (
            <div className="bg-destructive-soft mt-5 rounded-2xl p-4">
              <p className="text-label font-semibold">{labels.cancelConfirmTitle}</p>
              <p className="text-label-secondary mt-0.5 text-sm">{labels.cancelConfirmBody}</p>
              <input
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder={labels.cancelReasonLabel}
                maxLength={300}
                className="bg-inset ring-separator focus:ring-accent placeholder:text-label-tertiary mt-3 w-full rounded-xl px-3.5 py-2.5 text-[15px] ring-1 outline-none"
              />
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() =>
                    void run("cancel", () =>
                      setAppointmentStatusAction({
                        appointmentId,
                        action: "cancel",
                        reason: cancelReason.trim() || undefined,
                      }),
                    )
                  }
                  className="bg-destructive text-on-destructive inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
                >
                  {labels.yesCancel}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelOpen(false)}
                  className="text-label-secondary hover:text-label inline-flex h-10 items-center px-4 text-sm font-medium transition-colors"
                >
                  {labels.keepIt}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  tone,
  busy,
  selected,
  onClick,
}: {
  label: string;
  tone: "accent" | "tonal" | "success" | "ghost" | "destructive";
  busy: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent text-on-accent"
      : tone === "tonal"
        ? selected
          ? "bg-accent text-on-accent"
          : "bg-accent-soft text-accent"
        : tone === "success"
          ? "bg-success/15 text-success hover:bg-success/25"
          : tone === "destructive"
            ? selected
              ? "bg-destructive text-on-destructive"
              : "border-destructive/40 text-destructive border"
            : "border-separator text-label border";
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-all duration-150 active:scale-[0.96]",
        "disabled:pointer-events-none disabled:opacity-50",
        toneClass,
      )}
    >
      {label}
    </button>
  );
}

export function AdminNotesEditor({
  appointmentId,
  initialNotes,
  labels,
}: {
  appointmentId: string;
  initialNotes: string | null;
  labels: {
    notes: string;
    notesPlaceholder: string;
    saveNotes: string;
    saved: string;
    errorGeneric: string;
  };
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialNotes ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function save() {
    setState("saving");
    const result = await updateAdminNotesAction({ appointmentId, notes: value });
    if (result.ok) {
      setState("saved");
      router.refresh();
    } else {
      setState("idle");
    }
  }

  return (
    <div className="mt-8">
      <label className="block">
        <span className="text-label-secondary mb-1.5 block text-xs font-semibold tracking-[0.12em] uppercase">
          {labels.notes}
        </span>
        <textarea
          value={value}
          rows={3}
          maxLength={1000}
          placeholder={labels.notesPlaceholder}
          onChange={(event) => {
            setValue(event.target.value);
            setState("idle");
          }}
          className="bg-inset ring-separator focus:ring-accent placeholder:text-label-tertiary w-full rounded-xl px-3.5 py-2.5 text-[15px] ring-1 transition-shadow outline-none"
        />
      </label>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          disabled={state === "saving"}
          onClick={() => void save()}
          className="bg-accent-soft text-accent inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition-transform duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
        >
          {state === "saved" ? labels.saved : labels.saveNotes}
        </button>
      </div>
    </div>
  );
}
