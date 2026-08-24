"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBreakAction,
  createClosureAction,
  deleteBreakAction,
  deleteClosureAction,
  saveScheduleAction,
} from "@/lib/admin/settings-actions";
import { SmallButton } from "@/app/[locale]/admin/settings/services/services-client";
import { SaveBar, useSettingsSubmit, type SettingsError } from "@/components/admin/settings-bits";

type Interval = { start: string; end: string };
type DayHours = { weekday: number; intervals: Interval[] };

const WEEKDAY_IDS = [0, 1, 2, 3, 4, 5, 6] as const;

function errorText(error: SettingsError, invalid: string, generic: string): string | null {
  if (error === "INVALID_INPUT") return invalid;
  if (error === "GENERIC") return generic;
  return null;
}

export function HoursEditor({
  barberId,
  days,
  weekdays,
  labels,
}: {
  barberId: string | null;
  days: DayHours[];
  weekdays: { weekday: number; label: string }[];
  labels: {
    save: string;
    saving: string;
    saved: string;
    closed: string;
    addInterval: string;
    error_INVALID_INPUT: string;
    error_GENERIC: string;
  };
}) {
  const router = useRouter();
  const byWeekday = new Map(days.map((day) => [day.weekday, day.intervals]));
  const [draft, setDraft] = useState<Record<number, Interval[]>>(() => {
    const initial: Record<number, Interval[]> = {};
    for (const weekday of WEEKDAY_IDS) initial[weekday] = byWeekday.get(weekday) ?? [];
    return initial;
  });
  const submit = useSettingsSubmit(saveScheduleAction);

  function setInterval(weekday: number, index: number, patch: Partial<Interval>) {
    setDraft((current) => ({
      ...current,
      [weekday]: current[weekday].map((interval, i) =>
        i === index ? { ...interval, ...patch } : interval,
      ),
    }));
  }

  async function onSave() {
    const payload = WEEKDAY_IDS.map((weekday) => ({ weekday, intervals: draft[weekday] }));
    if (await submit.submit({ barberId, days: payload })) router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      className="ring-separator bg-card mt-4 rounded-2xl p-4 ring-1"
    >
      <div className="divide-separator divide-y">
        {weekdays.map((day) => (
          <div key={day.weekday} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-start">
            <span className="text-label w-24 shrink-0 pt-1.5 text-[14px] font-medium">
              {day.label}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              {draft[day.weekday].length === 0 ? (
                <span className="text-label-tertiary text-[13px]">{labels.closed}</span>
              ) : (
                draft[day.weekday].map((interval, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={interval.start}
                      onChange={(event) =>
                        setInterval(day.weekday, index, { start: event.target.value })
                      }
                      className="bg-inset ring-separator focus:ring-accent rounded-lg px-2 py-1.5 text-[13px] tabular-nums ring-1 outline-none"
                    />
                    <span className="text-label-tertiary">–</span>
                    <input
                      type="time"
                      value={interval.end}
                      onChange={(event) =>
                        setInterval(day.weekday, index, { end: event.target.value })
                      }
                      className="bg-inset ring-separator focus:ring-accent rounded-lg px-2 py-1.5 text-[13px] tabular-nums ring-1 outline-none"
                    />
                    <SmallButton
                      label="×"
                      destructive
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          [day.weekday]: current[day.weekday].filter((_, i) => i !== index),
                        }))
                      }
                    />
                  </div>
                ))
              )}
              <SmallButton
                label={`+ ${labels.addInterval}`}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    [day.weekday]: [...current[day.weekday], { start: "09:00", end: "17:00" }],
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <SaveBar
        saveLabel={labels.save}
        savingLabel={labels.saving}
        savedLabel={labels.saved}
        errorLabel={errorText(submit.error, labels.error_INVALID_INPUT, labels.error_GENERIC)}
        pending={submit.pending}
        justSaved={submit.justSaved}
        error={submit.error}
      />
    </form>
  );
}

interface BreakRowView {
  id: string;
  barberId: string | null;
  kind: "RECURRING" | "ONE_OFF";
  weekday: number | null;
  oneOffDate: string | null;
  startTime: string;
  endTime: string;
  reason: string | null;
}

interface ClosureRowView {
  id: string;
  barberId: string | null;
  startDate: string;
  endDate: string;
  fullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export function BreaksClosures({
  breaks,
  closures,
  barbers,
  weekdays,
  labels,
}: {
  breaks: BreakRowView[];
  closures: ClosureRowView[];
  barbers: { id: string | null; label: string }[];
  weekdays: { weekday: number; label: string }[];
  labels: Record<string, string>;
}) {
  const router = useRouter();

  const [breakKind, setBreakKind] = useState<"RECURRING" | "ONE_OFF">("RECURRING");
  const [breakDraft, setBreakDraft] = useState({
    barberId: "" as string,
    weekday: 1,
    oneOffDate: "",
    startTime: "13:00",
    endTime: "14:00",
    reason: "",
  });
  const breakSubmit = useSettingsSubmit(createBreakAction);
  const deleteBreak = useSettingsSubmit(deleteBreakAction);

  const [closureDraft, setClosureDraft] = useState({
    barberId: "" as string,
    startDate: "",
    endDate: "",
    fullDay: true,
    startTime: "00:00",
    endTime: "00:00",
    reason: "",
  });
  const closureSubmit = useSettingsSubmit(createClosureAction);
  const deleteClosure = useSettingsSubmit(deleteClosureAction);

  async function addBreak() {
    const ok = await breakSubmit.submit({
      barberId: breakDraft.barberId || null,
      kind: breakKind,
      weekday: breakKind === "RECURRING" ? breakDraft.weekday : null,
      oneOffDate: breakKind === "ONE_OFF" && breakDraft.oneOffDate ? breakDraft.oneOffDate : null,
      startTime: breakDraft.startTime,
      endTime: breakDraft.endTime,
      reason: breakDraft.reason.trim() === "" ? null : breakDraft.reason.trim(),
    });
    if (ok) router.refresh();
  }

  async function addClosure() {
    const partial = !closureDraft.fullDay;
    const ok = await closureSubmit.submit({
      barberId: closureDraft.barberId || null,
      startDate: closureDraft.startDate,
      endDate: closureDraft.endDate || closureDraft.startDate,
      fullDay: closureDraft.fullDay,
      startTime: partial ? closureDraft.startTime : null,
      endTime: partial ? closureDraft.endTime : null,
      reason: closureDraft.reason.trim() === "" ? null : closureDraft.reason.trim(),
    });
    if (ok) router.refresh();
  }

  const inputClass =
    "bg-inset ring-separator focus:ring-accent rounded-xl px-2.5 py-1.5 text-[14px] ring-1 outline-none";

  return (
    <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-2">
      <section className="ring-separator bg-card h-fit rounded-2xl p-4 ring-1">
        <h2 className="text-label text-[15px] font-semibold">{labels.breaksTitle}</h2>
        <ul className="divide-separator divide-y">
          {breaks.length === 0 ? (
            <li className="text-label-tertiary py-3 text-sm">{labels.noBreaks}</li>
          ) : (
            breaks.map((row) => (
              <li key={row.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-label text-[14px] font-medium">
                    {row.kind === "RECURRING"
                      ? `${labels.breakRecurring} · ${weekdays.find((day) => day.weekday === row.weekday)?.label ?? ""}`
                      : `${labels.breakOneOff} · ${row.oneOffDate ?? ""}`}
                  </p>
                  <p className="text-label-secondary text-[12px] tabular-nums">
                    {row.startTime}–{row.endTime}
                    {row.barberId
                      ? ` · ${barbers.find((barber) => barber.id === row.barberId)?.label ?? ""}`
                      : ""}
                  </p>
                </div>
                <SmallButton
                  label="×"
                  title={labels.deleteBreak}
                  destructive
                  busy={deleteBreak.pending}
                  onClick={async () => {
                    if (await deleteBreak.submit({ id: row.id })) router.refresh();
                  }}
                />
              </li>
            ))
          )}
        </ul>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void addBreak();
          }}
          className="border-separator mt-3 grid gap-2 border-t pt-3"
        >
          <div className="flex gap-1.5">
            {(["RECURRING", "ONE_OFF"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setBreakKind(kind)}
                className={
                  breakKind === kind
                    ? "bg-accent-soft text-accent ring-accent/30 inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
                    : "bg-inset text-label-secondary ring-separator inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
                }
              >
                {kind === "RECURRING" ? labels.breakRecurring : labels.breakOneOff}
              </button>
            ))}
          </div>
          <select
            value={breakDraft.barberId}
            onChange={(event) =>
              setBreakDraft((current) => ({ ...current, barberId: event.target.value }))
            }
            className={`${inputClass} text-label-secondary`}
          >
            {barbers.map((barber) => (
              <option key={barber.id ?? "any"} value={barber.id ?? ""}>
                {barber.label}
              </option>
            ))}
          </select>
          {breakKind === "RECURRING" ? (
            <select
              value={breakDraft.weekday}
              onChange={(event) =>
                setBreakDraft((current) => ({ ...current, weekday: Number(event.target.value) }))
              }
              className={`${inputClass} text-label`}
            >
              {weekdays.map((day) => (
                <option key={day.weekday} value={day.weekday}>
                  {day.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              required
              value={breakDraft.oneOffDate}
              onChange={(event) =>
                setBreakDraft((current) => ({ ...current, oneOffDate: event.target.value }))
              }
              className={`${inputClass} tabular-nums`}
            />
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={breakDraft.startTime}
              onChange={(event) =>
                setBreakDraft((current) => ({ ...current, startTime: event.target.value }))
              }
              className={`${inputClass} tabular-nums`}
            />
            <span className="text-label-tertiary">–</span>
            <input
              type="time"
              value={breakDraft.endTime}
              onChange={(event) =>
                setBreakDraft((current) => ({ ...current, endTime: event.target.value }))
              }
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <input
            type="text"
            placeholder={labels.reason}
            value={breakDraft.reason}
            onChange={(event) =>
              setBreakDraft((current) => ({ ...current, reason: event.target.value }))
            }
            className={`${inputClass} text-label`}
          />
          <SaveBar
            saveLabel={labels.addBreak}
            savingLabel={labels.saving}
            savedLabel={labels.saved}
            errorLabel={errorText(
              breakSubmit.error,
              labels.error_INVALID_INPUT,
              labels.error_GENERIC,
            )}
            pending={breakSubmit.pending}
            justSaved={breakSubmit.justSaved}
            error={breakSubmit.error}
          />
        </form>
      </section>

      <section className="ring-separator bg-card h-fit rounded-2xl p-4 ring-1">
        <h2 className="text-label text-[15px] font-semibold">{labels.closuresTitle}</h2>
        <ul className="divide-separator divide-y">
          {closures.length === 0 ? (
            <li className="text-label-tertiary py-3 text-sm">{labels.noClosures}</li>
          ) : (
            closures.map((row) => (
              <li key={row.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-label text-[14px] font-medium tabular-nums">
                    {row.startDate === row.endDate
                      ? row.startDate
                      : `${row.startDate} → ${row.endDate}`}
                  </p>
                  <p className="text-label-secondary text-[12px] tabular-nums">
                    {row.fullDay
                      ? labels.closureFullDay
                      : `${row.startTime ?? ""}–${row.endTime ?? ""}`}
                    {row.barberId
                      ? ` · ${barbers.find((barber) => barber.id === row.barberId)?.label ?? ""}`
                      : ""}
                  </p>
                </div>
                <SmallButton
                  label="×"
                  title={labels.deleteClosure}
                  destructive
                  busy={deleteClosure.pending}
                  onClick={async () => {
                    if (await deleteClosure.submit({ id: row.id })) router.refresh();
                  }}
                />
              </li>
            ))
          )}
        </ul>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void addClosure();
          }}
          className="border-separator mt-3 grid gap-2 border-t pt-3"
        >
          <div className="flex gap-1.5">
            {[true, false].map((fullDay) => (
              <button
                key={String(fullDay)}
                type="button"
                onClick={() => setClosureDraft((current) => ({ ...current, fullDay }))}
                className={
                  closureDraft.fullDay === fullDay
                    ? "bg-accent-soft text-accent ring-accent/30 inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
                    : "bg-inset text-label-secondary ring-separator inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
                }
              >
                {fullDay ? labels.closureFullDay : labels.closurePartial}
              </button>
            ))}
          </div>
          <select
            value={closureDraft.barberId}
            onChange={(event) =>
              setClosureDraft((current) => ({ ...current, barberId: event.target.value }))
            }
            className={`${inputClass} text-label-secondary`}
          >
            {barbers.map((barber) => (
              <option key={barber.id ?? "any"} value={barber.id ?? ""}>
                {barber.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-label-secondary mb-1 block text-[12px]">
                {labels.startDate}
              </span>
              <input
                type="date"
                required
                value={closureDraft.startDate}
                onChange={(event) =>
                  setClosureDraft((current) => ({ ...current, startDate: event.target.value }))
                }
                className={`${inputClass} tabular-nums`}
              />
            </label>
            <label className="block">
              <span className="text-label-secondary mb-1 block text-[12px]">{labels.endDate}</span>
              <input
                type="date"
                required
                value={closureDraft.endDate}
                onChange={(event) =>
                  setClosureDraft((current) => ({ ...current, endDate: event.target.value }))
                }
                className={`${inputClass} tabular-nums`}
              />
            </label>
          </div>
          {!closureDraft.fullDay ? (
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={closureDraft.startTime}
                onChange={(event) =>
                  setClosureDraft((current) => ({ ...current, startTime: event.target.value }))
                }
                className={`${inputClass} tabular-nums`}
              />
              <span className="text-label-tertiary">–</span>
              <input
                type="time"
                value={closureDraft.endTime}
                onChange={(event) =>
                  setClosureDraft((current) => ({ ...current, endTime: event.target.value }))
                }
                className={`${inputClass} tabular-nums`}
              />
            </div>
          ) : null}
          <input
            type="text"
            placeholder={labels.reason}
            value={closureDraft.reason}
            onChange={(event) =>
              setClosureDraft((current) => ({ ...current, reason: event.target.value }))
            }
            className={`${inputClass} text-label`}
          />
          <SaveBar
            saveLabel={labels.addClosure}
            savingLabel={labels.saving}
            savedLabel={labels.saved}
            errorLabel={errorText(
              closureSubmit.error,
              labels.error_INVALID_INPUT,
              labels.error_GENERIC,
            )}
            pending={closureSubmit.pending}
            justSaved={closureSubmit.justSaved}
            error={closureSubmit.error}
          />
        </form>
      </section>
    </div>
  );
}
