"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteServiceAction,
  reorderServicesAction,
  toggleServiceActiveAction,
  upsertServiceAction,
} from "@/lib/admin/settings-actions";
import {
  Field,
  LocalizedField,
  SaveBar,
  settingsInputClass,
  useSettingsSubmit,
  type SettingsError,
} from "@/components/admin/settings-bits";

interface EditableService {
  id: string;
  name: { en: string; ne?: string };
  description: { en: string; ne?: string } | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  active: boolean;
  priceLabel: string;
}

interface Labels {
  add: string;
  edit: string;
  save: string;
  saving: string;
  saved: string;
  cancelLabel: string;
  remove: string;
  confirmDelete: string;
  active: string;
  inactive: string;
  moveUp: string;
  moveDown: string;
  newService: string;
  empty: string;
  nameEn: string;
  nameNe: string;
  optionalNe: string;
  description: string;
  duration: string;
  buffer: string;
  price: string;
  priceHint: string;
  error_IN_USE: string;
  error_INVALID_INPUT: string;
  error_GENERIC: string;
}

const emptyDraft: {
  name: { en: string; ne?: string };
  description: { en: string; ne?: string } | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
} = {
  name: { en: "" },
  description: null,
  durationMinutes: 30,
  bufferMinutes: 10,
  priceCents: 0,
};

export function ServicesManager({
  services,
  labels,
}: {
  services: EditableService[];
  labels: Labels;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const save = useSettingsSubmit(upsertServiceAction);
  const toggle = useSettingsSubmit(toggleServiceActiveAction);
  const reorder = useSettingsSubmit(reorderServicesAction);
  const remove = useSettingsSubmit(deleteServiceAction);

  function startNew() {
    setEditingId(null);
    setDraft({ ...emptyDraft, name: { en: "" } });
    document.getElementById("editor")?.scrollIntoView({ behavior: "smooth" });
  }

  function startEdit(service: EditableService) {
    setEditingId(service.id);
    setDraft({
      name: { ...service.name },
      description: service.description ? { ...service.description } : null,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      priceCents: service.priceCents,
    });
  }

  async function onSave() {
    const ok = await save.submit(editingId ? { id: editingId, ...draft } : draft);
    if (ok) {
      setEditingId(null);
      setDraft({ ...emptyDraft, name: { en: "" } });
      router.refresh();
    }
  }

  async function onToggle(id: string, active: boolean) {
    if (await toggle.submit({ id, active })) router.refresh();
  }

  async function onMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= services.length) return;
    const ids = services.map((service) => service.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    if (await reorder.submit({ orderedIds: ids })) router.refresh();
  }

  async function onDelete(id: string) {
    const result = await remove.submit({ id });
    setConfirmingId(null);
    if (result) router.refresh();
  }

  function errorLabel(error: SettingsError): string | null {
    if (error === "IN_USE") return labels.error_IN_USE;
    if (error === "INVALID_INPUT") return labels.error_INVALID_INPUT;
    if (error === "GENERIC") return labels.error_GENERIC;
    return null;
  }

  return (
    <div className="pb-6">
      <ul className="mt-4 space-y-2">
        {services.length === 0 ? (
          <p className="text-label-tertiary py-4 text-sm">{labels.empty}</p>
        ) : (
          services.map((service, index) => (
            <li key={service.id} className="ring-separator bg-card rounded-2xl p-3.5 ring-1">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-label truncate text-[15px] font-medium">{service.name.en}</p>
                  <p className="text-label-secondary text-[13px] tabular-nums">
                    {service.durationMinutes}+{service.bufferMinutes}m · {service.priceLabel}
                  </p>
                </div>
                <span
                  className={
                    service.active
                      ? "text-success shrink-0 text-xs font-semibold uppercase"
                      : "text-label-tertiary shrink-0 text-xs font-semibold uppercase"
                  }
                >
                  {service.active ? labels.active : labels.inactive}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <SmallButton label={labels.edit} onClick={() => startEdit(service)} />
                <SmallButton
                  label={service.active ? labels.inactive : labels.active}
                  onClick={() => onToggle(service.id, !service.active)}
                  busy={toggle.pending}
                />
                <SmallButton
                  label="↑"
                  title={labels.moveUp}
                  onClick={() => onMove(index, -1)}
                  disabled={index === 0}
                />
                <SmallButton
                  label="↓"
                  title={labels.moveDown}
                  onClick={() => onMove(index, 1)}
                  disabled={index === services.length - 1}
                />
                {confirmingId === service.id ? (
                  <>
                    <SmallButton
                      label={labels.remove}
                      destructive
                      busy={remove.pending}
                      onClick={() => onDelete(service.id)}
                    />
                    <SmallButton label={labels.cancelLabel} onClick={() => setConfirmingId(null)} />
                  </>
                ) : (
                  <SmallButton
                    label={labels.remove}
                    destructive
                    onClick={() => setConfirmingId(service.id)}
                  />
                )}
                {remove.error === "IN_USE" && confirmingId === service.id ? (
                  <span className="text-destructive text-xs">{labels.error_IN_USE}</span>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>

      <button
        type="button"
        onClick={startNew}
        className="bg-accent-soft text-accent mt-4 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        + {labels.newService}
      </button>

      <form
        id="editor"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
        className="ring-separator bg-card mt-5 rounded-2xl p-4 ring-1"
      >
        <p className="text-label text-[15px] font-semibold">
          {editingId ? labels.edit : labels.newService}
        </p>
        <div className="mt-3 grid gap-3">
          <LocalizedField
            labelEn={labels.nameEn}
            labelNe={labels.nameNe}
            optionalLabel={labels.optionalNe}
            value={draft.name}
            onChange={(name) => setDraft((current) => ({ ...current, name }))}
          />
          <LocalizedField
            labelEn={labels.description}
            value={draft.description ?? { en: "" }}
            onChange={(description) =>
              setDraft((current) => ({
                ...current,
                description: description.en === "" && !description.ne ? null : description,
              }))
            }
            multiline
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={labels.duration}>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={draft.durationMinutes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    durationMinutes: Number(event.target.value) || 0,
                  }))
                }
                className={`${settingsInputClass} tabular-nums`}
              />
            </Field>
            <Field label={labels.buffer}>
              <input
                type="number"
                min={0}
                max={120}
                step={5}
                value={draft.bufferMinutes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    bufferMinutes: Number(event.target.value) || 0,
                  }))
                }
                className={`${settingsInputClass} tabular-nums`}
              />
            </Field>
            <Field label={labels.price} hint={labels.priceHint}>
              <input
                type="number"
                min={0}
                step={500}
                value={draft.priceCents}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priceCents: Number(event.target.value) || 0,
                  }))
                }
                className={`${settingsInputClass} tabular-nums`}
              />
            </Field>
          </div>
        </div>
        <SaveBar
          saveLabel={labels.save}
          savingLabel={labels.saving}
          savedLabel={labels.saved}
          errorLabel={save.error === null ? null : errorLabel(save.error)}
          pending={save.pending}
          justSaved={save.justSaved}
          error={save.error}
        />
      </form>
    </div>
  );
}

export function SmallButton({
  label,
  onClick,
  disabled = false,
  destructive = false,
  busy = false,
  title,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  busy?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled || busy}
      className={
        destructive
          ? "text-destructive ring-destructive/30 hover:bg-destructive-soft inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1 transition-colors disabled:opacity-40"
          : "bg-inset text-label-secondary hover:text-label inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium transition-colors disabled:opacity-40"
      }
    >
      {label}
    </button>
  );
}
