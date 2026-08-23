import { loadHaptics } from "@/lib/preferences";

/**
 * Haptic feedback via the Vibration API. iOS Safari does not implement it,
 * so this is a progressive enhancement for Android and supported browsers.
 */
export type HapticPattern =
  "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<HapticPattern, number[]> = {
  selection: [4],
  light: [8],
  medium: [16],
  heavy: [28],
  success: [10, 60, 14],
  warning: [14, 70, 14, 70, 14],
  error: [20, 60, 20],
};

export const HAPTIC_PATTERN_NAMES = Object.keys(PATTERNS) as HapticPattern[];

export function hapticPattern(pattern: HapticPattern): number[] {
  return PATTERNS[pattern];
}

export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Fire a haptic if supported and not disabled by preference. */
export function haptic(pattern: HapticPattern): boolean {
  if (!hapticsSupported() || !loadHaptics()) {
    return false;
  }
  return navigator.vibrate(hapticPattern(pattern));
}
