"use client";

import { useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SettingsError = "IN_USE" | "INVALID_INPUT" | "GENERIC" | null;

/** en required, ne optional; empty ne stays undefined so fallback kicks in. */
export function LocalizedField({
  labelEn,
  labelNe,
  optionalLabel,
  value,
  onChange,
  multiline = false,
}: {
  labelEn: string;
  labelNe?: string;
  optionalLabel?: string;
  value: { en: string; ne?: string };
  onChange: (next: { en: string; ne?: string }) => void;
  multiline?: boolean;
}) {
  const inputClass =
    "bg-inset ring-separator focus:ring-accent w-full rounded-xl px-3 py-2 text-[15px] ring-1 outline-none transition-shadow placeholder:text-label-tertiary";
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block">
        <span className="text-label-secondary mb-1 block text-[13px] font-medium">{labelEn}</span>
        {multiline ? (
          <textarea
            value={value.en}
            onChange={(event) => onChange({ ...value, en: event.target.value })}
            rows={2}
            className={inputClass}
          />
        ) : (
          <input
            type="text"
            value={value.en}
            onChange={(event) => onChange({ ...value, en: event.target.value })}
            className={inputClass}
          />
        )}
      </label>
      {labelNe ? (
        <label className="block">
          <span className="text-label-secondary mb-1 block text-[13px] font-medium">
            {labelNe}
            {optionalLabel ? (
              <span className="text-label-tertiary ml-1.5 font-normal">· {optionalLabel}</span>
            ) : null}
          </span>
          {multiline ? (
            <textarea
              value={value.ne ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  ne: event.target.value === "" ? undefined : event.target.value,
                })
              }
              rows={2}
              className={inputClass}
              dir="auto"
            />
          ) : (
            <input
              type="text"
              value={value.ne ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  ne: event.target.value === "" ? undefined : event.target.value,
                })
              }
              className={inputClass}
              dir="auto"
            />
          )}
        </label>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-label-secondary mb-1 block text-[13px] font-medium">{label}</span>
      {children}
      {hint ? <span className="text-label-tertiary mt-1 block text-xs">{hint}</span> : null}
    </label>
  );
}

export const settingsInputClass =
  "bg-inset ring-separator focus:ring-accent w-full rounded-xl px-3 py-2 text-[15px] ring-1 outline-none transition-shadow placeholder:text-label-tertiary";
export function SaveBar({
  saveLabel,
  savingLabel,
  savedLabel,
  errorLabel,
  pending,
  justSaved,
  error,
  warnings,
}: {
  saveLabel: string;
  savingLabel: string;
  savedLabel: string;
  errorLabel: string | null;
  pending: boolean;
  justSaved: boolean;
  error: SettingsError;
  warnings?: ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out select-none active:scale-[0.96]",
            pending || error !== null
              ? "bg-inset text-label-secondary"
              : "bg-accent text-on-accent",
          )}
        >
          {pending ? savingLabel : saveLabel}
        </button>
        {justSaved && !pending && error === null ? (
          <span className="text-success text-[13px] font-medium">{savedLabel}</span>
        ) : null}
        {error !== null && !pending && errorLabel ? (
          <span className="text-destructive text-[13px] font-medium">{errorLabel}</span>
        ) : null}
      </div>
      {warnings && !pending && error === null ? <div className="mt-2">{warnings}</div> : null}
    </div>
  );
}

/** Wraps a mutation call with pending + transient saved state and warning capture. */
export function useSettingsSubmit<Args extends unknown[], W = unknown>(
  action: (...args: Args) => Promise<{ ok: true; warnings?: W[] } | { ok: false; code: string }>,
): {
  submit: (...args: Args) => Promise<boolean>;
  pending: boolean;
  justSaved: boolean;
  error: SettingsError;
  warnings: W[];
} {
  const [pending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<SettingsError>(null);
  const [warnings, setWarnings] = useState<W[]>([]);

  return {
    pending,
    justSaved: justSaved && !pending && error === null,
    error,
    warnings,
    submit: (...args: Args) =>
      new Promise((resolve) => {
        startTransition(async () => {
          setError(null);
          setJustSaved(false);
          setWarnings([]);
          try {
            const result = await action(...args);
            if (result.ok) {
              setWarnings(result.warnings ?? []);
              setJustSaved(true);
              setTimeout(() => setJustSaved(false), 2500);
              resolve(true);
            } else {
              setError((result as { code: SettingsError }).code);
              resolve(false);
            }
          } catch {
            setError("GENERIC");
            resolve(false);
          }
        });
      }),
  };
}
