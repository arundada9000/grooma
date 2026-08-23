"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True on the client after hydration. Guards portal rendering in SSR. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
