/**
 * User preference storage with an injected-storage core so logic stays
 * testable and SSR safe. Callers in the browser use the default helpers.
 */
export type Scheme = "light" | "dark";
export type Toggle = "on" | "off";

const KEYS = {
  scheme: "grooma.scheme",
  haptics: "grooma.haptics",
  sound: "grooma.sound",
} as const;

function read(store: Storage | null | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(store: Storage | null | undefined, key: string, value: string): void {
  try {
    store?.setItem(key, value);
  } catch {
    /* storage unavailable or full: preferences are best effort */
  }
}

export function loadScheme(store?: Storage | null): Scheme | null {
  const raw = read(store ?? defaultStore(), KEYS.scheme);
  return raw === "light" || raw === "dark" ? raw : null;
}

export function saveScheme(value: Scheme, store?: Storage | null): void {
  write(store ?? defaultStore(), KEYS.scheme, value);
}

/** Haptics default to on; sound defaults to off. */
export function loadHaptics(store?: Storage | null): boolean {
  return read(store ?? defaultStore(), KEYS.haptics) !== "off";
}

export function saveHaptics(enabled: boolean, store?: Storage | null): void {
  write(store ?? defaultStore(), KEYS.haptics, enabled ? "on" : "off");
}

export function loadSound(store?: Storage | null): boolean {
  return read(store ?? defaultStore(), KEYS.sound) === "on";
}

export function saveSound(enabled: boolean, store?: Storage | null): void {
  write(store ?? defaultStore(), KEYS.sound, enabled ? "on" : "off");
}

function defaultStore(): Storage | null | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage;
}
