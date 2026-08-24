"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBarberAction,
  toggleBarberActiveAction,
  upsertBarberAction,
} from "@/lib/admin/settings-actions";
import { SmallButton } from "@/app/[locale]/admin/settings/services/services-client";
import {
  Field,
  LocalizedField,
  SaveBar,
  settingsInputClass,
  useSettingsSubmit,
  type SettingsError,
} from "@/components/admin/settings-bits";

interface EditableBarber {
  id: string;
  displayName: string;
  bio: { en: string; ne?: string } | null;
  active: boolean;
  serviceIds: string[];
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
  newBarber: string;
  empty: string;
  nameEn: string;
  nameNe: string;
  optionalNe: string;
  bio: string;
  servicesField: string;
  noServices: string;
  error_IN_USE: string;
  error_INVALID_INPUT: string;
  error_GENERIC: string;
}

const emptyDraft: {
  displayName: string;
  bio: { en: string; ne?: string } | null;
  serviceIds: string[];
} = { displayName: "", bio: null, serviceIds: [] };

export function BarbersManager({
  barbers,
  services,
  labels,
}: {
  barbers: EditableBarber[];
  services: { id: string; label: string; active: boolean }[];
  labels: Labels;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const save = useSettingsSubmit(upsertBarberAction);
  const toggle = useSettingsSubmit(toggleBarberActiveAction);
  const remove = useSettingsSubmit(deleteBarberAction);

  function startEdit(barber: EditableBarber) {
    setEditingId(barber.id);
    setDraft({
      displayName: barber.displayName,
      bio: barber.bio ? { ...barber.bio } : null,
      serviceIds: [...barber.serviceIds],
    });
    document.getElementById("editor")?.scrollIntoView({ behavior: "smooth" });
  }

  async function onSave() {
    const ok = await save.submit(editingId ? { id: editingId, ...draft } : draft);
    if (ok) {
      setEditingId(null);
      setDraft({ ...emptyDraft, displayName: "" });
      router.refresh();
    }
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
        {barbers.length === 0 ? (
          <p className="text-label-tertiary py-4 text-sm">{labels.empty}</p>
        ) : null}
        {barbers.map((barber) => (
          <li key={barber.id} className="ring-separator bg-card rounded-2xl p-3.5 ring-1">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
              >
                {barber.displayName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              <p className="text-label min-w-0 flex-1 truncate text-[15px] font-medium">
                {barber.displayName}
              </p>
              <span
                className={
                  barber.active
                    ? "text-success shrink-0 text-xs font-semibold uppercase"
                    : "text-label-tertiary shrink-0 text-xs font-semibold uppercase"
                }
              >
                {barber.active ? labels.active : labels.inactive}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <SmallButton label={labels.edit} onClick={() => startEdit(barber)} />
              <SmallButton
                label={barber.active ? labels.inactive : labels.active}
                onClick={async () => {
                  if (await toggle.submit({ id: barber.id, active: !barber.active }))
                    router.refresh();
                }}
              />
              {confirmingId === barber.id ? (
                <>
                  <SmallButton
                    label={labels.remove}
                    destructive
                    busy={remove.pending}
                    onClick={async () => {
                      if (await remove.submit({ id: barber.id })) setConfirmingId(null);
                      router.refresh();
                    }}
                  />
                  <SmallButton label={labels.cancelLabel} onClick={() => setConfirmingId(null)} />
                </>
              ) : (
                <SmallButton
                  label={labels.remove}
                  destructive
                  onClick={() => setConfirmingId(barber.id)}
                />
              )}
              {remove.error === "IN_USE" && confirmingId === barber.id ? (
                <span className="text-destructive text-xs">{labels.error_IN_USE}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          setEditingId(null);
          setDraft({ ...emptyDraft, displayName: "" });
          document.getElementById("editor")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="bg-accent-soft text-accent mt-4 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        + {labels.newBarber}
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
          {editingId ? labels.edit : labels.newBarber}
        </p>
        <div className="mt-3 grid gap-3">
          <Field label={labels.nameEn}>
            <input
              type="text"
              value={draft.displayName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, displayName: event.target.value }))
              }
              className={settingsInputClass}
            />
          </Field>
          <LocalizedField
            labelEn={labels.bio}
            value={draft.bio ?? { en: "" }}
            onChange={(bio) =>
              setDraft((current) => ({ ...current, bio: bio.en === "" && !bio.ne ? null : bio }))
            }
            multiline
          />
          <fieldset>
            <legend className="text-label-secondary mb-1.5 text-[13px] font-medium">
              {labels.servicesField}
            </legend>
            {services.length === 0 ? (
              <p className="text-label-tertiary text-[13px]">{labels.noServices}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const checked = draft.serviceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={
                        checked
                          ? "bg-accent-soft text-accent ring-accent/30 inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-[13px] font-medium ring-1"
                          : "bg-inset text-label-secondary ring-separator hover:text-label inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-[13px] font-medium ring-1 transition-colors"
                      }
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            serviceIds: checked
                              ? current.serviceIds.filter((id) => id !== service.id)
                              : [...current.serviceIds, service.id],
                          }))
                        }
                      />
                      {service.label}
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
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
