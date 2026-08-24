/**
 * Interval math over half open minute ranges [start, end) of a single
 * day. Endpoints never overlap: [540, 600) and [600, 660) are adjacent,
 * not conflicting. All functions are pure and allocation friendly.
 */

export interface MinuteRange {
  start: number;
  end: number;
}

export function overlaps(a: MinuteRange, b: MinuteRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Sorts by start and fuses touching or overlapping ranges. */
export function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
  const sorted = [...ranges].sort((x, y) => x.start - y.start || x.end - y.end);
  const merged: MinuteRange[] = [];
  for (const range of sorted) {
    if (range.end <= range.start) continue;
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ start: range.start, end: range.end });
    }
  }
  return merged;
}

/**
 * Removes every cut from the base windows, returning sorted disjoint
 * remainders. Cuts may overlap each other arbitrarily.
 */
export function subtractRanges(base: MinuteRange[], cuts: MinuteRange[]): MinuteRange[] {
  const mergedCuts = mergeRanges(cuts);
  const result: MinuteRange[] = [];
  for (const window of mergeRanges(base)) {
    let cursor = window.start;
    for (const cut of mergedCuts) {
      if (cut.end <= cursor) continue;
      if (cut.start >= window.end) break;
      if (cut.start > cursor) {
        result.push({ start: cursor, end: Math.min(cut.start, window.end) });
      }
      cursor = Math.max(cursor, cut.end);
      if (cursor >= window.end) break;
    }
    if (cursor < window.end) {
      result.push({ start: cursor, end: window.end });
    }
  }
  return result;
}

/** True when target fits entirely inside container. */
export function contains(container: MinuteRange, target: MinuteRange): boolean {
  return container.start <= target.start && target.end <= container.end;
}

/** True when any base window contains target. */
export function containedInAny(base: MinuteRange[], target: MinuteRange): boolean {
  return base.some((window) => contains(window, target));
}

export function totalMinutes(ranges: MinuteRange[]): number {
  return ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
}
