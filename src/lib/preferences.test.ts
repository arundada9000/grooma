import { describe, expect, it } from "vitest";
import {
  loadHaptics,
  loadScheme,
  loadSound,
  saveHaptics,
  saveScheme,
  saveSound,
} from "./preferences";

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    getLength: () => map.size,
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
    length: map.size,
    [Symbol.iterator]: function* () {
      yield* map.entries();
    },
  } as Storage;
}

describe("preferences", () => {
  it("returns null scheme when nothing stored or value invalid", () => {
    expect(loadScheme(fakeStorage())).toBeNull();
    expect(loadScheme(fakeStorage({ "grooma.scheme": "blue" }))).toBeNull();
  });

  it("round trips scheme", () => {
    const store = fakeStorage();
    saveScheme("dark", store);
    expect(loadScheme(store)).toBe("dark");
    saveScheme("light", store);
    expect(loadScheme(store)).toBe("light");
  });

  it("defaults haptics on and sound off", () => {
    expect(loadHaptics(fakeStorage())).toBe(true);
    expect(loadHaptics(null)).toBe(true);
    expect(loadSound(fakeStorage())).toBe(false);
    expect(loadSound(undefined)).toBe(false);
  });

  it("persists toggles as on/off strings", () => {
    const store = fakeStorage();
    saveHaptics(false, store);
    saveSound(true, store);
    expect(store.getItem("grooma.haptics")).toBe("off");
    expect(store.getItem("grooma.sound")).toBe("on");
    expect(loadHaptics(store)).toBe(false);
    expect(loadSound(store)).toBe(true);
  });

  it("tolerates throwing storage without crashing", () => {
    const hostile = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(loadScheme(hostile)).toBeNull();
    expect(() => saveScheme("dark", hostile)).not.toThrow();
  });
});
