"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveShopProfileAction } from "@/lib/admin/settings-actions";
import {
  Field,
  SaveBar,
  settingsInputClass,
  useSettingsSubmit,
  type SettingsError,
} from "@/components/admin/settings-bits";

interface FormState {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  website: string;
  addressLine: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  mapsUrl: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  youtube: string;
}

type Labels = Record<string, string>;

function orUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function GeneralForm({ initial, labels }: { initial: FormState; labels: Labels }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const submit = useSettingsSubmit(saveShopProfileAction);

  function bind<K extends keyof FormState>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((current) => ({ ...current, [key]: event.target.value }));
  }

  async function onSave() {
    const ok = await submit.submit({
      name: draft.name,
      shortName: orUndefined(draft.shortName),
      tagline: orUndefined(draft.tagline),
      description: orUndefined(draft.description),
      contact: {
        phone: draft.phone.trim(),
        email: orUndefined(draft.email),
        whatsapp: orUndefined(draft.whatsapp),
        website: orUndefined(draft.website),
      },
      location: {
        addressLine: draft.addressLine.trim(),
        city: draft.city.trim(),
        province: orUndefined(draft.province),
        country: draft.country.trim(),
        postalCode: orUndefined(draft.postalCode),
        mapsUrl: orUndefined(draft.mapsUrl),
      },
      social: {
        facebook: orUndefined(draft.facebook),
        instagram: orUndefined(draft.instagram),
        tiktok: orUndefined(draft.tiktok),
        twitter: orUndefined(draft.twitter),
        youtube: orUndefined(draft.youtube),
      },
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
      className="ring-separator bg-card mt-4 max-w-xl rounded-2xl p-4 ring-1"
    >
      <div className="grid gap-3">
        <Field label={labels.shopName}>
          <input
            type="text"
            required
            value={draft.name}
            onChange={bind("name")}
            className={settingsInputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={labels.shortName}>
            <input
              type="text"
              value={draft.shortName}
              onChange={bind("shortName")}
              className={settingsInputClass}
            />
          </Field>
          <Field label={labels.tagline}>
            <input
              type="text"
              value={draft.tagline}
              onChange={bind("tagline")}
              className={settingsInputClass}
            />
          </Field>
        </div>
        <Field label={labels.description}>
          <textarea
            rows={3}
            value={draft.description}
            onChange={bind("description")}
            className={settingsInputClass}
          />
        </Field>

        <h2 className="text-label border-separator mt-2 border-t pt-3 text-[15px] font-semibold">
          {labels.contactTitle}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label={labels.phone}>
            <input
              type="tel"
              required
              value={draft.phone}
              onChange={bind("phone")}
              className={`${settingsInputClass} tabular-nums`}
            />
          </Field>
          <Field label={labels.email}>
            <input
              type="email"
              value={draft.email}
              onChange={bind("email")}
              className={settingsInputClass}
            />
          </Field>
          <Field label={labels.whatsapp}>
            <input
              type="tel"
              value={draft.whatsapp}
              onChange={bind("whatsapp")}
              className={`${settingsInputClass} tabular-nums`}
            />
          </Field>
          <Field label={labels.website}>
            <input
              type="url"
              value={draft.website}
              onChange={bind("website")}
              className={settingsInputClass}
            />
          </Field>
        </div>

        <h2 className="text-label border-separator mt-2 border-t pt-3 text-[15px] font-semibold">
          {labels.locationTitle}
        </h2>
        <Field label={labels.addressLine}>
          <input
            type="text"
            required
            value={draft.addressLine}
            onChange={bind("addressLine")}
            className={settingsInputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={labels.city}>
            <input
              type="text"
              required
              value={draft.city}
              onChange={bind("city")}
              className={settingsInputClass}
            />
          </Field>
          <Field label={labels.province}>
            <input
              type="text"
              value={draft.province}
              onChange={bind("province")}
              className={settingsInputClass}
            />
          </Field>
          <Field label={labels.country}>
            <input
              type="text"
              required
              value={draft.country}
              onChange={bind("country")}
              className={settingsInputClass}
            />
          </Field>
          <Field label={labels.postalCode}>
            <input
              type="text"
              value={draft.postalCode}
              onChange={bind("postalCode")}
              className={`${settingsInputClass} tabular-nums`}
            />
          </Field>
        </div>
        <Field label={labels.mapsUrl}>
          <input
            type="url"
            value={draft.mapsUrl}
            onChange={bind("mapsUrl")}
            className={settingsInputClass}
            dir="ltr"
          />
        </Field>

        <h2 className="text-label border-separator mt-2 border-t pt-3 text-[15px] font-semibold">
          {labels.socialTitle}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label={labels.facebook}>
            <input
              type="url"
              value={draft.facebook}
              onChange={bind("facebook")}
              className={settingsInputClass}
              dir="ltr"
            />
          </Field>
          <Field label={labels.instagram}>
            <input
              type="url"
              value={draft.instagram}
              onChange={bind("instagram")}
              className={settingsInputClass}
              dir="ltr"
            />
          </Field>
          <Field label={labels.tiktok}>
            <input
              type="url"
              value={draft.tiktok}
              onChange={bind("tiktok")}
              className={settingsInputClass}
              dir="ltr"
            />
          </Field>
          <Field label={labels.twitter}>
            <input
              type="url"
              value={draft.twitter}
              onChange={bind("twitter")}
              className={settingsInputClass}
              dir="ltr"
            />
          </Field>
          <Field label={labels.youtube}>
            <input
              type="url"
              value={draft.youtube}
              onChange={bind("youtube")}
              className={settingsInputClass}
              dir="ltr"
            />
          </Field>
        </div>
      </div>
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
