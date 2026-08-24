"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBrandingAction } from "@/lib/admin/settings-actions";
import type { ThemeColors } from "@/lib/theme/presets";
import { buildThemeStyle, type CustomThemeOverrides } from "@/lib/theme/theme-css";
import {
  Field,
  SaveBar,
  settingsInputClass,
  useSettingsSubmit,
  type SettingsError,
} from "@/components/admin/settings-bits";

type ColorKey = keyof ThemeColors;

const EDITABLE_KEYS: ColorKey[] = [
  "background",
  "card",
  "inset",
  "label",
  "labelSecondary",
  "labelTertiary",
  "separator",
  "accent",
  "accentSoft",
  "onAccent",
];

interface BrandingDraft {
  presetId: string;
  fontPairing?: string;
  style?: string;
  light: Partial<Record<ColorKey, string>>;
  dark: Partial<Record<ColorKey, string>>;
  logoUrl: string;
  faviconUrl: string;
}

interface ContrastWarning {
  pair: string;
  scheme: "light" | "dark";
  ratio: number;
  minimum: number;
}

const PAIR_LABEL_KEYS: Record<string, string> = {
  "label on background": "labelOnBackground",
  "label secondary on background": "labelSecondaryOnBackground",
  "on accent": "onAccent",
  "accent on background": "accentOnBackground",
  "on destructive": "onDestructive",
};

export function AppearanceEditor({
  initial,
  presets,
  fontPairings,
  labels,
}: {
  initial: BrandingDraft;
  presets: {
    id: string;
    name: string;
    accentLight: string;
    backgroundLight: string;
    accentDark: string;
    backgroundDark: string;
  }[];
  fontPairings: { id: string; name: string }[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<BrandingDraft>(initial);
  const submit = useSettingsSubmit(saveBrandingAction);

  // Live preview: apply the draft straight onto <html>, same vars the server layout emits.
  useEffect(() => {
    const style = buildThemeStyle({
      presetId: draft.presetId,
      fontPairing: draft.fontPairing,
      customTheme: {
        light: draft.light as CustomThemeOverrides["light"],
        dark: draft.dark as CustomThemeOverrides["dark"],
        style: draft.style as CustomThemeOverrides["style"],
      },
    });
    const rootStyle = document.documentElement.style;
    for (const [key, value] of Object.entries(style)) {
      if (typeof value === "string") rootStyle.setProperty(key, value);
    }
  }, [draft]);

  async function onSave() {
    const ok = await submit.submit({
      presetId: draft.presetId,
      ...(draft.fontPairing ? { fontPairing: draft.fontPairing } : {}),
      customTheme:
        draft.style || Object.keys(draft.light).length > 0 || Object.keys(draft.dark).length > 0
          ? {
              ...(Object.keys(draft.light).length > 0 ? { light: draft.light } : {}),
              ...(Object.keys(draft.dark).length > 0 ? { dark: draft.dark } : {}),
              ...(draft.style ? { style: draft.style } : {}),
            }
          : undefined,
      logoUrl: draft.logoUrl.trim() === "" ? "" : draft.logoUrl.trim(),
      faviconUrl: draft.faviconUrl.trim() === "" ? "" : draft.faviconUrl.trim(),
    });
    if (ok) router.refresh();
  }

  function errorLabel(error: SettingsError): string | null {
    if (error === "INVALID_INPUT") return labels.error_INVALID_INPUT;
    if (error === "GENERIC") return labels.error_GENERIC;
    return null;
  }

  function pill(active: boolean) {
    return active
      ? "bg-accent-soft text-accent ring-accent/30 inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1"
      : "bg-inset text-label-secondary ring-separator hover:text-label inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1 transition-colors";
  }

  function colorRow(scheme: "light" | "dark", key: ColorKey) {
    const value = draft[scheme][key] ?? "";
    return (
      <div key={key} className="flex items-center gap-2">
        <span className="text-label-secondary min-w-0 flex-1 truncate text-[13px]">
          {labels[`colorLabels_${key}`]}
        </span>
        <span
          aria-hidden="true"
          className="ring-separator size-6 shrink-0 rounded-full ring-1"
          style={{ background: value || "transparent" }}
        />
        <input
          type="text"
          dir="ltr"
          placeholder="#000000"
          value={value}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              [scheme]:
                event.target.value === ""
                  ? omitKey(current[scheme], key)
                  : { ...current[scheme], [key]: event.target.value },
            }))
          }
          className="bg-inset ring-separator focus:ring-accent w-28 rounded-lg px-2 py-1 text-[12px] tabular-nums ring-1 outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() =>
              setDraft((current) => ({ ...current, [scheme]: omitKey(current[scheme], key) }))
            }
            className="text-label-tertiary hover:text-label text-[12px]"
          >
            ×
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      className="mt-4 max-w-2xl pb-6"
    >
      <section className="ring-separator bg-card rounded-2xl p-4 ring-1">
        <h2 className="text-label text-[15px] font-semibold">{labels.presetLabel}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setDraft((current) => ({ ...current, presetId: preset.id }))}
              className={
                draft.presetId === preset.id
                  ? "ring-accent rounded-xl p-2 text-left ring-2"
                  : "ring-separator hover:bg-inset rounded-xl p-2 text-left ring-1 transition-colors"
              }
            >
              <span className="flex overflow-hidden rounded-lg">
                <span className="h-7 flex-1" style={{ background: preset.backgroundLight }} />
                <span className="h-7 w-5" style={{ background: preset.accentLight }} />
                <span className="h-7 flex-1" style={{ background: preset.backgroundDark }} />
                <span className="h-7 w-5" style={{ background: preset.accentDark }} />
              </span>
              <span className="text-label mt-1.5 block text-[13px] font-medium">{preset.name}</span>
            </button>
          ))}
        </div>

        <h2 className="text-label mt-5 text-[15px] font-semibold">{labels.fontsLabel}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {fontPairings.map((pairing) => (
            <button
              key={pairing.id}
              type="button"
              onClick={() => setDraft((current) => ({ ...current, fontPairing: pairing.id }))}
              className={pill(draft.fontPairing === pairing.id)}
            >
              {pairing.name}
            </button>
          ))}
        </div>

        <h2 className="text-label mt-5 text-[15px] font-semibold">{labels.styleLabel}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["standard", "soft", "deep"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  style: current.style === style ? undefined : style,
                }))
              }
              className={pill(draft.style === style)}
            >
              {labels[`styles${style[0].toUpperCase()}${style.slice(1)}`]}
            </button>
          ))}
        </div>
      </section>

      <section className="ring-separator bg-card mt-4 rounded-2xl p-4 ring-1">
        <h2 className="text-label text-[15px] font-semibold">{labels.customTitle}</h2>
        <p className="text-label-tertiary mt-0.5 text-xs">{labels.previewNote}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-label-secondary mb-2 text-[13px] font-medium">
              {labels.lightScheme}
            </h3>
            <div className="space-y-1.5">{EDITABLE_KEYS.map((key) => colorRow("light", key))}</div>
          </div>
          <div>
            <h3 className="text-label-secondary mb-2 text-[13px] font-medium">
              {labels.darkScheme}
            </h3>
            <div className="space-y-1.5">{EDITABLE_KEYS.map((key) => colorRow("dark", key))}</div>
          </div>
        </div>
      </section>

      <section className="ring-separator bg-card mt-4 rounded-2xl p-4 ring-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={labels.logoUrl}>
            <input
              type="url"
              value={draft.logoUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, logoUrl: event.target.value }))
              }
              className={`${settingsInputClass} text-[14px]`}
              dir="ltr"
            />
          </Field>
          <Field label={labels.faviconUrl}>
            <input
              type="url"
              value={draft.faviconUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, faviconUrl: event.target.value }))
              }
              className={`${settingsInputClass} text-[14px]`}
              dir="ltr"
            />
          </Field>
        </div>
      </section>

      <SaveBar
        saveLabel={labels.save}
        savingLabel={labels.saving}
        savedLabel={labels.saved}
        errorLabel={errorLabel(submit.error)}
        pending={submit.pending}
        justSaved={submit.justSaved}
        error={submit.error}
        warnings={
          submit.warnings.length === 0 ? null : (
            <ul className="text-warning space-y-1">
              {submit.warnings.map((warning, index) => (
                <WarningRow
                  key={`${warning.scheme}-${warning.pair}-${index}`}
                  warning={warning}
                  labels={labels}
                />
              ))}
            </ul>
          )
        }
      />
    </form>
  );
}

function WarningRow({
  warning,
  labels,
}: {
  warning: ContrastWarning;
  labels: Record<string, string>;
}) {
  const pairKey = PAIR_LABEL_KEYS[warning.pair];
  return (
    <li className="text-[13px] leading-relaxed">
      {renderTemplate(labels.contrastWarning, {
        scheme: labels[`schemes_${warning.scheme}`] ?? warning.scheme,
        pair: (pairKey ? labels[`contrastPairs_${pairKey}`] : undefined) ?? warning.pair,
        ratio: String(warning.ratio),
        minimum: String(warning.minimum),
      })}
    </li>
  );
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function omitKey(
  overrides: Partial<Record<ColorKey, string>>,
  key: ColorKey,
): Partial<Record<ColorKey, string>> {
  const next = { ...overrides };
  delete next[key];
  return next;
}
