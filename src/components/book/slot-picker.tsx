"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Slot } from "@/lib/scheduling/types";
import type { Locale } from "@/i18n/config";
import { formatDate, formatTime } from "@/i18n/format";
import { getAvailabilityAction } from "@/lib/booking/actions";

/**
 * Day strip plus time grid fed by the availability engine through the
 * server action. Seven day chunks load lazily as the customer pages
 * through them; unavailable starts stay visible but disabled so a busy
 * day never looks mysteriously empty.
 */

const CHUNK_DAYS = 7;

export interface SlotPickerLabels {
  pickDate: string;
  pickTime: string;
  loadingTimes: string;
  noSlotsDay: string;
  closedMark: string;
  laterDays: string;
  earlierDays: string;
}

export interface SlotPickerProps {
  locale: Locale;
  /** All bookable days as YYYY-MM-DD grouped into ordered chunks. */
  chunks: string[][];
  serviceId: string;
  /** "ANY" asks the engine across every eligible barber. */
  barberId: string;
  labels: SlotPickerLabels;
  selectedDateKey: string | null;
  selectedStartMs: number | null;
  onDaySelect: (dateKey: string) => void;
  onSlotSelect: (slot: Slot) => void;
  /** Bump to drop the cache after a conflict so slots refetch. */
  refreshSignal?: number;
}

/** UTC midnight anchor; formatting pins the shop zone so the date matches. */
function dayAnchorMs(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00Z`);
}

interface DaySlots {
  dateKey: string;
  slots: Slot[];
}

export function SlotPicker({
  locale,
  chunks,
  serviceId,
  barberId,
  labels,
  selectedDateKey,
  selectedStartMs,
  onDaySelect,
  onSlotSelect,
  refreshSignal = 0,
}: SlotPickerProps) {
  const [chunkIndex, setChunkIndex] = useState(0);
  // Entries are keyed by selection signature + chunk so a service or
  // barber change (or conflict refresh) simply misses instead of needing
  // cache clearing effects.
  const [entries, setEntries] = useState<Map<string, Slot[]>>(new Map());
  const requestRef = useRef(0);

  const signature = `${serviceId}|${barberId}|${refreshSignal}`;
  const chunkKeys = useMemo(() => chunks[chunkIndex] ?? [], [chunks, chunkIndex]);
  const cacheKey = `${signature}|${chunkIndex}`;

  useEffect(() => {
    if (chunkKeys.length === 0 || entries.has(cacheKey)) return;
    const requestId = ++requestRef.current;
    let cancelled = false;
    void (async () => {
      const result = await getAvailabilityAction({
        serviceId,
        barberId: barberId === "ANY" ? null : barberId,
        dateKeys: chunkKeys,
      });
      if (cancelled || requestId !== requestRef.current) return;
      const slots = Array.isArray(result) ? result : [];
      setEntries((previous) => new Map(previous).set(cacheKey, slots));
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, chunkKeys, entries, serviceId, barberId]);

  const days = useMemo<DaySlots[]>(() => {
    const chunkSlots = entries.get(cacheKey);
    if (!chunkSlots) return [];
    const byDay = new Map<string, Slot[]>();
    for (const key of chunkKeys) byDay.set(key, []);
    for (const slot of chunkSlots) {
      const list = byDay.get(slot.dateKey);
      if (list) list.push(slot);
    }
    return [...byDay.entries()].map(([dateKey, slots]) => ({ dateKey, slots }));
  }, [entries, cacheKey, chunkKeys]);

  const hasChunk = entries.has(cacheKey);
  const visibleDay =
    days.find((day) => day.dateKey === selectedDateKey) ??
    days.find((day) => day.slots.some((slot) => slot.available)) ??
    days[0];

  return (
    <div>
      <p className="text-label mb-2 text-sm font-medium">{labels.pickDate}</p>
      <div className="flex items-center gap-2">
        <NavButton
          direction="prev"
          disabled={chunkIndex === 0}
          label={labels.earlierDays}
          onClick={() => setChunkIndex((i) => Math.max(0, i - 1))}
        />
        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {(hasChunk
            ? days
            : Array.from({ length: Math.min(CHUNK_DAYS, chunkKeys.length) }, (_, i) => ({
                dateKey: chunkKeys[i],
                slots: [] as Slot[],
              }))
          ).map((day) => {
            const open = day.slots.some((slot) => slot.available);
            const isSelected = day.dateKey === visibleDay?.dateKey;
            return (
              <button
                key={day.dateKey}
                type="button"
                disabled={!open}
                aria-pressed={isSelected}
                onClick={() => onDaySelect(day.dateKey)}
                className={cn(
                  "rounded-xl px-0 py-2 text-center transition-colors duration-150",
                  "disabled:pointer-events-none",
                  isSelected
                    ? "bg-accent text-on-accent"
                    : cn("bg-inset hover:bg-card", !open && "opacity-40"),
                )}
              >
                <span className="block text-[10px] font-medium tracking-wide uppercase opacity-70">
                  {formatDate(dayAnchorMs(day.dateKey), locale, { weekday: "short" })}
                </span>
                <span className="block text-[15px] leading-tight font-semibold tabular-nums">
                  {formatDate(dayAnchorMs(day.dateKey), locale, { day: "numeric" })}
                </span>
              </button>
            );
          })}
        </div>
        <NavButton
          direction="next"
          disabled={chunkIndex >= chunks.length - 1}
          label={labels.laterDays}
          onClick={() => setChunkIndex((i) => Math.min(chunks.length - 1, i + 1))}
        />
      </div>

      <p className="text-label mt-5 mb-2 text-sm font-medium">{labels.pickTime}</p>

      {!hasChunk ? (
        <p className="text-label-secondary py-6 text-center text-sm">{labels.loadingTimes}</p>
      ) : visibleDay == null || visibleDay.slots.length === 0 ? (
        <p className="text-label-tertiary py-4 text-sm">{labels.closedMark}</p>
      ) : (
        <>
          <p className="text-label-secondary mb-2 text-[13px]">
            {formatDate(dayAnchorMs(visibleDay.dateKey), locale, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <TimeGrid
            slots={visibleDay.slots}
            locale={locale}
            selectedStartMs={selectedStartMs}
            onPick={onSlotSelect}
            emptyLabel={labels.noSlotsDay}
          />
        </>
      )}
    </div>
  );
}

function NavButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      className="bg-inset text-label-secondary hover:bg-card flex h-9 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 disabled:pointer-events-none disabled:opacity-30"
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}

function TimeGrid({
  slots,
  locale,
  selectedStartMs,
  onPick,
  emptyLabel,
}: {
  slots: Slot[];
  locale: Locale;
  selectedStartMs: number | null;
  onPick: (slot: Slot) => void;
  emptyLabel: string;
}) {
  if (!slots.some((slot) => slot.available)) {
    return <p className="text-label-tertiary py-4 text-sm">{emptyLabel}</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot.startMs}
          type="button"
          disabled={!slot.available}
          aria-pressed={slot.startMs === selectedStartMs}
          onClick={() => onPick(slot)}
          className={cn(
            "h-10 rounded-xl text-[15px] font-medium tabular-nums transition-[background-color,color,transform] duration-150",
            "active:scale-[0.96] disabled:pointer-events-none",
            slot.startMs === selectedStartMs
              ? "bg-accent text-on-accent"
              : slot.available
                ? "bg-inset hover:bg-card"
                : "bg-inset/50 text-label-tertiary line-through opacity-60",
          )}
        >
          {formatTime(slot.startMs, locale)}
        </button>
      ))}
    </div>
  );
}
