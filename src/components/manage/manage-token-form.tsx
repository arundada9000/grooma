"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

/** Token entry: paste or tap a manage link token, jump to the booking. */

export function ManageTokenForm({
  labels,
}: {
  labels: { title: string; subtitle: string; placeholder: string; submit: string; invalid: string };
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [touched, setTouched] = useState(false);

  // Same shape the generator emits: base64url, 43 chars for 32 bytes.
  const valid = /^[A-Za-z0-9_-]{20,100}$/.test(token.trim());

  function handleSubmit() {
    setTouched(true);
    if (!valid) return;
    router.push(`./${token.trim()}`);
  }

  return (
    <div className="px-4 py-10">
      <h1 className="text-label text-[32px] font-semibold tracking-tight">{labels.title}</h1>
      <p className="text-label-secondary mt-1 text-[15px]">{labels.subtitle}</p>
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={labels.placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={touched && !valid}
          className={cn(
            "bg-inset ring-separator focus:ring-accent placeholder:text-label-tertiary min-w-0 flex-1 rounded-xl px-4 py-3 text-[15px] ring-1 transition-shadow outline-none",
            touched && !valid && "ring-destructive",
          )}
        />
        <button
          type="submit"
          disabled={token.length === 0}
          className={cn(
            "bg-accent text-on-accent inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium",
            "transition-transform duration-150 ease-out active:scale-[0.96]",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          {labels.submit}
        </button>
      </form>
      {touched && !valid ? (
        <p role="alert" className="text-destructive mt-2 text-[13px]">
          {labels.invalid}
        </p>
      ) : null}
    </div>
  );
}
