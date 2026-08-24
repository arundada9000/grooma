import { describe, expect, it } from "vitest";
import {
  containedInAny,
  contains,
  mergeRanges,
  overlaps,
  subtractRanges,
  totalMinutes,
} from "./interval";

describe("interval math", () => {
  it("treats half open ranges as non overlapping at shared endpoints", () => {
    expect(overlaps({ start: 540, end: 600 }, { start: 600, end: 660 })).toBe(false);
    expect(overlaps({ start: 540, end: 601 }, { start: 600, end: 660 })).toBe(true);
    expect(overlaps({ start: 600, end: 660 }, { start: 540, end: 600 })).toBe(false);
  });

  it("detects containment and partial overlap", () => {
    expect(contains({ start: 0, end: 100 }, { start: 10, end: 90 })).toBe(true);
    expect(contains({ start: 0, end: 100 }, { start: 0, end: 101 })).toBe(false);
  });

  it("merges touching and overlapping ranges sorted by start", () => {
    expect(
      mergeRanges([
        { start: 120, end: 180 },
        { start: 0, end: 60 },
        { start: 60, end: 90 },
        { start: 150, end: 200 },
      ]),
    ).toEqual([
      { start: 0, end: 90 },
      { start: 120, end: 200 },
    ]);
  });

  it("drops empty and inverted inputs on merge", () => {
    expect(
      mergeRanges([
        { start: 50, end: 50 },
        { start: 70, end: 40 },
      ]),
    ).toEqual([]);
  });

  it("subtracts cuts from multiple windows including cut spanning windows", () => {
    const base = [
      { start: 540, end: 780 },
      { start: 840, end: 1080 },
    ];
    expect(subtractRanges(base, [{ start: 600, end: 900 }])).toEqual([
      { start: 540, end: 600 },
      { start: 900, end: 1080 },
    ]);
  });

  it("subtracts overlapping cuts as one removal", () => {
    const base = [{ start: 0, end: 300 }];
    expect(
      subtractRanges(base, [
        { start: 50, end: 120 },
        { start: 100, end: 200 },
      ]),
    ).toEqual([
      { start: 0, end: 50 },
      { start: 200, end: 300 },
    ]);
  });

  it("returns base untouched when cuts are outside", () => {
    const base = [{ start: 100, end: 200 }];
    expect(
      subtractRanges(base, [
        { start: 0, end: 100 },
        { start: 200, end: 300 },
      ]),
    ).toEqual([{ start: 100, end: 200 }]);
  });

  it("checks containment across a set", () => {
    const base = [
      { start: 540, end: 720 },
      { start: 780, end: 1020 },
    ];
    expect(containedInAny(base, { start: 700, end: 780 })).toBe(false);
    expect(containedInAny(base, { start: 780, end: 1020 })).toBe(true);
    expect(totalMinutes(base)).toBe(420);
  });
});
