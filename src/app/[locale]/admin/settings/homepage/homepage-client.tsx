"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHomepageAction } from "@/lib/admin/settings-actions";
import { SmallButton } from "@/app/[locale]/admin/settings/services/services-client";
import { SaveBar, useSettingsSubmit, type SettingsError } from "@/components/admin/settings-bits";

interface SectionDraft {
  type: string;
  enabled: boolean;
}

export function HomepageEditor({
  initial,
  allTypes,
  typeLabels,
  labels,
}: {
  initial: SectionDraft[];
  allTypes: string[];
  typeLabels: Record<string, string>;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [sections, setSections] = useState<SectionDraft[]>(() =>
    // Stored order first; types never configured yet trail disabled.
    [
      ...initial,
      ...allTypes
        .filter((type) => !initial.some((s) => s.type === type))
        .map((type) => ({ type, enabled: false })),
    ],
  );
  const submit = useSettingsSubmit(saveHomepageAction);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function onSave() {
    const ok = await submit.submit({
      sections: sections.map((section) => ({ ...section, content: {} })),
    });
    if (ok) router.refresh();
  }

  function errorLabel(error: SettingsError): string | null {
    if (error === "INVALID_INPUT") return labels.error_INVALID_INPUT;
    if (error === "GENERIC") return labels.error_GENERIC;
    return null;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      className="mt-4 max-w-xl pb-6"
    >
      <ul className="ring-separator bg-card divide-separator divide-y rounded-2xl ring-1">
        {sections.map((section, index) => (
          <li key={section.type} className="flex items-center gap-3 px-3.5 py-2.5">
            <span className="text-label-secondary w-6 shrink-0 text-center text-[12px] tabular-nums">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={() =>
                setSections((current) =>
                  current.map((item) =>
                    item.type === section.type ? { ...item, enabled: !item.enabled } : item,
                  ),
                )
              }
              aria-pressed={section.enabled}
              className={
                section.enabled
                  ? "text-success ring-success/30 hover:bg-success/10 inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide uppercase ring-1 transition-colors"
                  : "text-label-tertiary ring-separator hover:bg-inset inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide uppercase ring-1 transition-colors"
              }
            >
              {section.enabled ? labels.active : labels.inactive}
            </button>
            <span
              className={
                section.enabled
                  ? "text-label min-w-0 flex-1 truncate text-[14px] font-medium"
                  : "text-label-secondary min-w-0 flex-1 truncate text-[14px] font-medium"
              }
            >
              {typeLabels[section.type] ?? section.type}
            </span>
            <SmallButton
              label="↑"
              title={labels.up}
              onClick={() => move(index, -1)}
              disabled={index === 0}
            />
            <SmallButton
              label="↓"
              title={labels.down}
              onClick={() => move(index, 1)}
              disabled={index === sections.length - 1}
            />
          </li>
        ))}
      </ul>
      <SaveBar
        saveLabel={labels.save}
        savingLabel={labels.saving}
        savedLabel={labels.saved}
        errorLabel={errorLabel(submit.error)}
        pending={submit.pending}
        justSaved={submit.justSaved}
        error={submit.error}
      />
    </form>
  );
}
