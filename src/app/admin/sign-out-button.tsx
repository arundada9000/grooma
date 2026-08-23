"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      await authClient.signOut();
      router.replace("/sign-in");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      className="h-10 shrink-0 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
