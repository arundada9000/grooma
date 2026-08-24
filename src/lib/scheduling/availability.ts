import type { MinuteRange } from "./interval";
import { mergeRanges } from "./interval";
import { epochToZonedParts, wallTimeToEpochMs, weekdayOfDateKey } from "./format";
import {
  breaksForDate,
  closuresForDate,
  freeWindowsForBarber,
  projectBusyToDaySegments,
  windowsForBarber,
} from "./hours";
import { blockerAtMinute, footprintFits, generateSlotStarts } from "./slots";
import { checkNoticeAndWindow } from "./rules";
import type { AvailabilityInput, BusyRange, ServiceTiming, Slot, SlotBlockReason } from "./types";

export interface ExactProbeInput {
  zone: string;
  service: ServiceTiming;
  barberIds: string[];
  shopHours: AvailabilityInput["shopHours"];
  barberHours: AvailabilityInput["barberHours"];
  breaks: AvailabilityInput["breaks"];
  closures: AvailabilityInput["closures"];
}

const NO_SEGMENTS = new Map<string, MinuteRange[]>();

/**
 * Decides which barbers could take a booking starting exactly now.
 * `extraBusy` lets callers inject ranges discovered inside the booking
 * transaction (the anti double booking recheck).
 */
export function barbersForExactSlot(
  input: ExactProbeInput,
  dateKey: string,
  startMs: number,
  extraBusy: BusyRange[] = [],
): string[] {
  const perBarber = projectBusyToDaySegments(input.zone, extraBusy).get(dateKey);
  return input.barberIds.filter((barberId) => {
    const free = freeWindowsForBarber(input, barberId, dateKey, perBarber?.get(barberId));
    return footprintFits(free, input.service, epochToZonedParts(input.zone, startMs).minuteOfDay);
  });
}

function classifyBlocker(
  input: AvailabilityInput,
  barberId: string,
  dateKey: string,
  weekday: number,
  busySegments: ReadonlyMap<string, MinuteRange[]>,
  startMinute: number,
): SlotBlockReason {
  const working = windowsForBarber(input, barberId, weekday);
  if (working.length === 0) return "CLOSED";

  const breakCuts = [
    ...breaksForDate(input.breaks, barberId, dateKey),
    ...breaksForDate(input.breaks, null, dateKey),
  ];
  const closureCuts = [
    ...closuresForDate(input.closures, barberId, dateKey),
    ...closuresForDate(input.closures, null, dateKey),
  ];
  return (
    blockerAtMinute(
      working,
      breakCuts,
      closureCuts,
      busySegments.get(barberId) ?? [],
      startMinute,
    ) ?? "NO_BARBER"
  );
}

function toSlot(
  input: AvailabilityInput,
  dateKey: string,
  dayStartMs: number,
  startMinute: number,
  rest: { available: true; barberIds: string[] } | { available: false; reason: SlotBlockReason },
): Slot {
  const startMs = dayStartMs + startMinute * 60_000;
  const base = {
    dateKey,
    startMinute,
    startMs,
    endMs: startMs + input.service.durationMinutes * 60_000,
  };
  if (rest.available) {
    return { ...base, available: true, barberIds: rest.barberIds };
  }
  return { ...base, available: false, reason: rest.reason, barberIds: [] };
}

/**
 * Computes bookable and blocked starts for each requested day.
 *
 * Blocked minutes stay on the grid (disabled with a reason) whenever
 * they fall inside someone's working hours, so the UI can explain a
 * greyed out chip instead of showing an unexplained hole. Rule
 * failures like MIN_NOTICE and capacity misses like NO_BARBER are
 * attached here; database level races belong to the booking pipeline.
 */
export function getAvailability(input: AvailabilityInput): Slot[] {
  return input.dateKeys.flatMap((dateKey) => {
    const weekday = weekdayOfDateKey(dateKey);
    const dayStartMs = wallTimeToEpochMs(input.zone, dateKey, "00:00");

    // The grid spans the union of everyone's working windows so a
    // minute covered by any barber shows up, even when another
    // barber's schedule explains a block differently.
    const workingUnion: MinuteRange[] = [];
    for (const barberId of input.barberIds) {
      workingUnion.push(...windowsForBarber(input, barberId, weekday));
    }
    const gridWindows = mergeRanges(workingUnion);
    if (gridWindows.length === 0) return [];

    const busySegments =
      projectBusyToDaySegments(input.zone, input.busy).get(dateKey) ?? NO_SEGMENTS;

    return generateSlotStarts(gridWindows, input.rules.slotIntervalMinutes).map((startMinute) => {
      const ruleCheck = checkNoticeAndWindow(
        dayStartMs + startMinute * 60_000,
        input.nowMs,
        input.rules,
        input.zone,
      );
      if (!ruleCheck.ok) {
        return toSlot(input, dateKey, dayStartMs, startMinute, {
          available: false,
          reason: ruleCheck.reason!,
        });
      }

      const fittingBarbers = input.barberIds.filter((barberId) =>
        footprintFits(
          freeWindowsForBarber(input, barberId, dateKey, busySegments.get(barberId)),
          input.service,
          startMinute,
        ),
      );
      if (fittingBarbers.length > 0) {
        return toSlot(input, dateKey, dayStartMs, startMinute, {
          available: true,
          barberIds: fittingBarbers,
        });
      }

      const explanation =
        input.barberIds
          .map((barberId) =>
            classifyBlocker(input, barberId, dateKey, weekday, busySegments, startMinute),
          )
          .find((reason) => reason !== "NO_BARBER") ?? "NO_BARBER";

      return toSlot(input, dateKey, dayStartMs, startMinute, {
        available: false,
        reason: explanation,
      });
    });
  });
}
