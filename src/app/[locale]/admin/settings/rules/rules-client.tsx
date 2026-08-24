"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBookingRulesAction } from "@/lib/admin/settings-actions";
import type { BookingRules } from "@/lib/validation/shop-config";
import {
  Field,
  SaveBar,
  settingsInputClass,
  useSettingsSubmit,
  type SettingsError,
} from "@/components/admin/settings-bits";

interface Labels {
  save: string;
  saving: string;
  saved: string;
  slotIntervalMinutes: string;
  minNoticeMinutes: string;
  maxAdvanceDays: string;
  cancelDeadlineMinutes: string;
  rescheduleDeadlineMinutes: string;
  maxDailyBookingsPerCustomer: string;
  unlimited: string;
  error_INVALID_INPUT: string;
  error_GENERIC: string;
}

function numberField(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

export function RulesForm({ initial, labels }: { initial: BookingRules; labels: Labels }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    slotIntervalMinutes: initial.slotIntervalMinutes,
    minNoticeMinutes: initial.minNoticeMinutes,
    maxAdvanceDays: initial.maxAdvanceDays,
    cancelDeadlineMinutes: initial.cancelDeadlineMinutes,
    rescheduleDeadlineMinutes: initial.rescheduleDeadlineMinutes,
    maxDailyBookingsPerCustomer: numberField(initial.maxDailyBookingsPerCustomer),
  });
  const submit = useSettingsSubmit(saveBookingRulesAction);

  async function onSave() {
    const ok = await submit.submit({
      ...draft,
      maxDailyBookingsPerCustomer:
        draft.maxDailyBookingsPerCustomer === ""
          ? undefined
          : Number(draft.maxDailyBookingsPerCustomer),
    });
    if (ok) router.refresh();
  }

  function bind<K extends keyof typeof draft>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setDraft((current) => ({ ...current, [key]: event.target.value }));
  }

  function errorLabel(error: SettingsError): string | null {
    if (error === "INVALID_INPUT") return labels.error_INVALID_INPUT;
    if (error === "GENERIC") return labels.error_GENERIC;
    return null;
  }

  const numeric = (value: string) => (value === "" ? 0 : Number(value) || 0);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      className="ring-separator bg-card mt-4 max-w-xl rounded-2xl p-4 ring-1"
    >
      <div className="grid gap-3">
        <Field label={labels.slotIntervalMinutes}>
          <input
            type="number"
            min={5}
            max={60}
            step={5}
            required
            value={draft.slotIntervalMinutes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                slotIntervalMinutes: numeric(event.target.value),
              }))
            }
            className={`${settingsInputClass} tabular-nums`}
          />
        </Field>
        <Field label={labels.minNoticeMinutes}>
          <input
            type="number"
            min={0}
            step={15}
            required
            value={draft.minNoticeMinutes}
            onChange={(event) =>
              setDraft((current) => ({ ...current, minNoticeMinutes: numeric(event.target.value) }))
            }
            className={`${settingsInputClass} tabular-nums`}
          />
        </Field>
        <Field label={labels.maxAdvanceDays}>
          <input
            type="number"
            min={1}
            max={365}
            required
            value={draft.maxAdvanceDays}
            onChange={(event) =>
              setDraft((current) => ({ ...current, maxAdvanceDays: numeric(event.target.value) }))
            }
            className={`${settingsInputClass} tabular-nums`}
          />
        </Field>
        <Field label={labels.cancelDeadlineMinutes}>
          <input
            type="number"
            min={0}
            step={15}
            required
            value={draft.cancelDeadlineMinutes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                cancelDeadlineMinutes: numeric(event.target.value),
              }))
            }
            className={`${settingsInputClass} tabular-nums`}
          />
        </Field>
        <Field label={labels.rescheduleDeadlineMinutes}>
          <input
            type="number"
            min={0}
            step={15}
            required
            value={draft.rescheduleDeadlineMinutes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                rescheduleDeadlineMinutes: numeric(event.target.value),
              }))
            }
            className={`${settingsInputClass} tabular-nums`}
          />
        </Field>
        <Field label={labels.maxDailyBookingsPerCustomer} hint={labels.unlimited}>
          <input
            type="number"
            min={1}
            max={20}
            value={draft.maxDailyBookingsPerCustomer}
            onChange={bind("maxDailyBookingsPerCustomer")}
            className={`${settingsInputClass} tabular-nums`}
          />
        </Field>
      </div>
      <SaveBar
        saveLabel={labels.save}
        savingLabel={labels.saving}
        savedLabel={labels.saved}
        errorLabel={errorLabel(submit.error)}
        pending={submit.pending}
        justSaved={submit.justSaved}
        error={submit.error}
      />
    </form>
  );
}
