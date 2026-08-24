"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveHomepageAction } from "@/lib/admin/settings-actions";
import { SmallButton } from "@/app/[locale]/admin/settings/services/services-client";
import {
  Field,
  LocalizedField,
  SaveBar,
  settingsInputClass,
  useSettingsSubmit,
  type SettingsError,
} from "@/components/admin/settings-bits";
import type { ContentDraft, LocalizedDraft, SectionDraft, ServiceOption } from "./homepage-drafts";

/**
 * Homepage section editor. Order and enable state live on the row; the
 * content panel per row edits that section's authored text, images and
 * repeater items. Blank fields are legal everywhere: the input schema
 * collapses them so stored content stays minimal.
 */

const MAX_WHY_US = 6;
const MAX_GALLERY = 12;
const MAX_TESTIMONIALS = 9;
const MAX_FAQ = 10;

function localizedPayload(value: LocalizedDraft | undefined) {
  if (!value || value.en.trim() === "") return undefined;
  const ne = value.ne?.trim();
  return ne ? { en: value.en, ne } : { en: value.en };
}

function payloadFromDraft(draft: SectionDraft): Record<string, unknown> {
  const c = draft.content;
  switch (draft.type) {
    case "hero":
      return {
        headline: localizedPayload(c.headline),
        subheadline: localizedPayload(c.subheadline),
        imageUrl: c.imageUrl?.trim() || undefined,
        ctaLabel: localizedPayload(c.ctaLabel),
        secondaryCtaLabel: localizedPayload(c.secondaryCtaLabel),
      };
    case "featured-service":
      return {
        serviceId: c.serviceId || undefined,
        title: localizedPayload(c.title),
        subtitle: localizedPayload(c.subtitle),
      };
    case "about":
      return {
        body: localizedPayload(c.body),
        imageUrl: c.imageUrl?.trim() || undefined,
      };
    case "booking-cta":
      return {
        title: localizedPayload(c.title),
        subtitle: localizedPayload(c.subtitle),
        buttonLabel: localizedPayload(c.buttonLabel),
      };
    case "why-us":
      return {
        items: c.whyUsItems.map((item) => ({
          title: localizedPayload(item.title),
          description: localizedPayload(item.description),
        })),
      };
    case "gallery":
      return {
        images: c.galleryImages.map((image) => ({
          url: image.url.trim(),
          alt: localizedPayload(image.alt),
        })),
      };
    case "testimonials":
      return {
        items: c.testimonials.map((item) => ({
          quote: localizedPayload(item.quote),
          author: item.author.trim(),
          role: localizedPayload(item.role),
        })),
      };
    case "faq":
      return {
        items: c.faqItems.map((item) => ({
          question: localizedPayload(item.question),
          answer: localizedPayload(item.answer),
        })),
      };
    default:
      // services, barbers, opening-hours, location, contact
      return {
        title: localizedPayload(c.title),
        subtitle: localizedPayload(c.subtitle),
      };
  }
}

function emptyContent(): ContentDraft {
  return { whyUsItems: [], galleryImages: [], testimonials: [], faqItems: [] };
}

export interface HomepageEditorLabels {
  save: string;
  saving: string;
  saved: string;
  active: string;
  inactive: string;
  up: string;
  down: string;
  contentLabel: string;
  addItem: string;
  addImage: string;
  removeItem: string;
  title: string;
  subtitle: string;
  headline: string;
  subheadline: string;
  imageUrl: string;
  imageHint: string;
  ctaLabel: string;
  secondaryCtaLabel: string;
  buttonLabel: string;
  aboutBody: string;
  featuredService: string;
  featuredPlaceholder: string;
  quote: string;
  author: string;
  role: string;
  question: string;
  answer: string;
  altText: string;
  error_INVALID_INPUT: string;
  error_GENERIC: string;
}

export function HomepageEditor({
  initial,
  allTypes,
  typeLabels,
  serviceOptions,
  labels,
}: {
  initial: SectionDraft[];
  allTypes: string[];
  typeLabels: Record<string, string>;
  serviceOptions: ServiceOption[];
  labels: HomepageEditorLabels;
}) {
  const router = useRouter();
  const [sections, setSections] = useState<SectionDraft[]>(() =>
    // Stored order first; types never configured yet trail disabled.
    [
      ...initial,
      ...allTypes
        .filter((type) => !initial.some((s) => s.type === type))
        .map((type): SectionDraft => ({ type, enabled: false, content: emptyContent() })),
    ],
  );
  const [openType, setOpenType] = useState<string | null>(null);
  const submit = useSettingsSubmit(saveHomepageAction);

  function updateContent(type: string, patch: Partial<ContentDraft>) {
    setSections((current) =>
      current.map((section) =>
        section.type === type ? { ...section, content: { ...section.content, ...patch } } : section,
      ),
    );
  }

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
      sections: sections.map((section) => ({
        type: section.type,
        enabled: section.enabled,
        content: payloadFromDraft(section),
      })),
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
          <li key={section.type} className="px-3.5 py-2.5">
            <div className="flex items-center gap-3">
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
                    ? "text-success ring-success/30 hover:bg-success/10 inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide uppercase ring-1 transition-colors"
                    : "text-label-tertiary ring-separator hover:bg-inset inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide uppercase ring-1 transition-colors"
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
                label={labels.contentLabel}
                onClick={() => setOpenType(openType === section.type ? null : section.type)}
                disabled={openType !== null && openType !== section.type}
              />
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
            </div>
            {openType === section.type ? (
              <div className="border-separator mt-3 border-t pt-3 pb-1">
                <SectionFields
                  type={section.type}
                  draft={section.content}
                  onChange={(patch) => updateContent(section.type, patch)}
                  serviceOptions={serviceOptions}
                  labels={labels}
                />
              </div>
            ) : null}
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

/** One label, English input plus a NE-marked second input; blanks stay legal. */
function BilingualField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedDraft | undefined;
  onChange: (next: LocalizedDraft | undefined) => void;
  multiline?: boolean;
}) {
  return (
    <LocalizedField
      labelEn={label}
      labelNe={`${label} · NE`}
      value={value ?? { en: "" }}
      onChange={(next) => onChange(next.en.trim() === "" && !next.ne?.trim() ? undefined : next)}
      multiline={multiline}
    />
  );
}

function ImageUrlField({
  value,
  onChange,
  label,
  hint,
}: {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  label: string;
  hint: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-3">
        <input
          type="url"
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value.trim() === "" ? undefined : event.target.value)
          }
          className={settingsInputClass}
          placeholder="https://"
        />
        {value && value.trim() !== "" ? (
          <span className="bg-inset relative block size-14 shrink-0 overflow-hidden rounded-xl">
            <Image unoptimized src={value} alt="" fill sizes="56px" className="object-cover" />
          </span>
        ) : null}
      </div>
    </Field>
  );
}

function RepeaterCard({
  index,
  onRemove,
  removeLabel,
  children,
}: {
  index: number;
  onRemove: () => void;
  removeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ring-separator bg-inset/50 grid gap-2 rounded-2xl p-3 ring-1">
      <div className="flex items-center justify-between">
        <span className="text-label-tertiary text-[12px] tabular-nums">{index + 1}</span>
        <SmallButton label={removeLabel} destructive onClick={onRemove} />
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-accent-soft text-accent inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-medium transition-transform duration-150 ease-out select-none active:scale-[0.96]"
    >
      + {label}
    </button>
  );
}

function SectionFields({
  type,
  draft,
  onChange,
  serviceOptions,
  labels,
}: {
  type: string;
  draft: ContentDraft;
  onChange: (patch: Partial<ContentDraft>) => void;
  serviceOptions: ServiceOption[];
  labels: HomepageEditorLabels;
}) {
  switch (type) {
    case "hero":
      return (
        <div className="grid gap-3">
          <BilingualField
            label={labels.headline}
            value={draft.headline}
            onChange={(headline) => onChange({ headline })}
          />
          <BilingualField
            label={labels.subheadline}
            value={draft.subheadline}
            onChange={(subheadline) => onChange({ subheadline })}
            multiline
          />
          <ImageUrlField
            value={draft.imageUrl}
            onChange={(imageUrl) => onChange({ imageUrl })}
            label={labels.imageUrl}
            hint={labels.imageHint}
          />
          <BilingualField
            label={labels.ctaLabel}
            value={draft.ctaLabel}
            onChange={(ctaLabel) => onChange({ ctaLabel })}
          />
          <BilingualField
            label={labels.secondaryCtaLabel}
            value={draft.secondaryCtaLabel}
            onChange={(secondaryCtaLabel) => onChange({ secondaryCtaLabel })}
          />
        </div>
      );
    case "featured-service":
      return (
        <div className="grid gap-3">
          <Field label={labels.featuredService}>
            <select
              value={draft.serviceId ?? ""}
              onChange={(event) => onChange({ serviceId: event.target.value || undefined })}
              className={settingsInputClass}
            >
              <option value="">{labels.featuredPlaceholder}</option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                </option>
              ))}
            </select>
          </Field>
          <BilingualField
            label={labels.title}
            value={draft.title}
            onChange={(title) => onChange({ title })}
          />
          <BilingualField
            label={labels.subtitle}
            value={draft.subtitle}
            onChange={(subtitle) => onChange({ subtitle })}
            multiline
          />
        </div>
      );
    case "about":
      return (
        <div className="grid gap-3">
          <BilingualField
            label={labels.aboutBody}
            value={draft.body}
            onChange={(body) => onChange({ body })}
            multiline
          />
          <ImageUrlField
            value={draft.imageUrl}
            onChange={(imageUrl) => onChange({ imageUrl })}
            label={labels.imageUrl}
            hint={labels.imageHint}
          />
        </div>
      );
    case "why-us": {
      const atCap = draft.whyUsItems.length >= MAX_WHY_US;
      return (
        <div className="grid gap-3">
          {draft.whyUsItems.map((item, index) => (
            <RepeaterCard
              key={index}
              index={index}
              removeLabel={labels.removeItem}
              onRemove={() =>
                onChange({ whyUsItems: draft.whyUsItems.filter((_, i) => i !== index) })
              }
            >
              <BilingualField
                label={labels.title}
                value={item.title}
                onChange={(title) =>
                  onChange({
                    whyUsItems: draft.whyUsItems.map((entry, i) =>
                      i === index ? { ...entry, title: title ?? { en: "" } } : entry,
                    ),
                  })
                }
              />
              <BilingualField
                label={labels.subtitle}
                value={item.description}
                onChange={(description) =>
                  onChange({
                    whyUsItems: draft.whyUsItems.map((entry, i) =>
                      i === index ? { ...entry, description: description ?? { en: "" } } : entry,
                    ),
                  })
                }
                multiline
              />
            </RepeaterCard>
          ))}
          {!atCap ? (
            <AddButton
              label={labels.addItem}
              onClick={() =>
                onChange({
                  whyUsItems: [...draft.whyUsItems, { title: { en: "" }, description: { en: "" } }],
                })
              }
            />
          ) : null}
        </div>
      );
    }
    case "gallery": {
      const atCap = draft.galleryImages.length >= MAX_GALLERY;
      return (
        <div className="grid gap-3">
          {draft.galleryImages.map((image, index) => (
            <RepeaterCard
              key={index}
              index={index}
              removeLabel={labels.removeItem}
              onRemove={() =>
                onChange({ galleryImages: draft.galleryImages.filter((_, i) => i !== index) })
              }
            >
              <ImageUrlField
                value={image.url}
                onChange={(url) =>
                  onChange({
                    galleryImages: draft.galleryImages.map((entry, i) =>
                      i === index ? { ...entry, url: url ?? "" } : entry,
                    ),
                  })
                }
                label={labels.imageUrl}
                hint={labels.imageHint}
              />
              <BilingualField
                label={labels.altText}
                value={image.alt}
                onChange={(alt) =>
                  onChange({
                    galleryImages: draft.galleryImages.map((entry, i) =>
                      i === index ? { ...entry, alt: alt ?? { en: "" } } : entry,
                    ),
                  })
                }
              />
            </RepeaterCard>
          ))}
          {!atCap ? (
            <AddButton
              label={labels.addImage}
              onClick={() =>
                onChange({
                  galleryImages: [...draft.galleryImages, { url: "", alt: { en: "" } }],
                })
              }
            />
          ) : null}
        </div>
      );
    }
    case "testimonials": {
      const atCap = draft.testimonials.length >= MAX_TESTIMONIALS;
      return (
        <div className="grid gap-3">
          {draft.testimonials.map((item, index) => (
            <RepeaterCard
              key={index}
              index={index}
              removeLabel={labels.removeItem}
              onRemove={() =>
                onChange({ testimonials: draft.testimonials.filter((_, i) => i !== index) })
              }
            >
              <BilingualField
                label={labels.quote}
                value={item.quote}
                onChange={(quote) =>
                  onChange({
                    testimonials: draft.testimonials.map((entry, i) =>
                      i === index ? { ...entry, quote: quote ?? { en: "" } } : entry,
                    ),
                  })
                }
                multiline
              />
              <Field label={labels.author}>
                <input
                  type="text"
                  value={item.author}
                  onChange={(event) =>
                    onChange({
                      testimonials: draft.testimonials.map((entry, i) =>
                        i === index ? { ...entry, author: event.target.value } : entry,
                      ),
                    })
                  }
                  className={settingsInputClass}
                />
              </Field>
              <BilingualField
                label={labels.role}
                value={item.role}
                onChange={(role) =>
                  onChange({
                    testimonials: draft.testimonials.map((entry, i) =>
                      i === index ? { ...entry, role: role ?? { en: "" } } : entry,
                    ),
                  })
                }
              />
            </RepeaterCard>
          ))}
          {!atCap ? (
            <AddButton
              label={labels.addItem}
              onClick={() =>
                onChange({
                  testimonials: [
                    ...draft.testimonials,
                    { quote: { en: "" }, author: "", role: { en: "" } },
                  ],
                })
              }
            />
          ) : null}
        </div>
      );
    }
    case "faq": {
      const atCap = draft.faqItems.length >= MAX_FAQ;
      return (
        <div className="grid gap-3">
          {draft.faqItems.map((item, index) => (
            <RepeaterCard
              key={index}
              index={index}
              removeLabel={labels.removeItem}
              onRemove={() => onChange({ faqItems: draft.faqItems.filter((_, i) => i !== index) })}
            >
              <BilingualField
                label={labels.question}
                value={item.question}
                onChange={(question) =>
                  onChange({
                    faqItems: draft.faqItems.map((entry, i) =>
                      i === index ? { ...entry, question: question ?? { en: "" } } : entry,
                    ),
                  })
                }
              />
              <BilingualField
                label={labels.answer}
                value={item.answer}
                onChange={(answer) =>
                  onChange({
                    faqItems: draft.faqItems.map((entry, i) =>
                      i === index ? { ...entry, answer: answer ?? { en: "" } } : entry,
                    ),
                  })
                }
                multiline
              />
            </RepeaterCard>
          ))}
          {!atCap ? (
            <AddButton
              label={labels.addItem}
              onClick={() =>
                onChange({
                  faqItems: [...draft.faqItems, { question: { en: "" }, answer: { en: "" } }],
                })
              }
            />
          ) : null}
        </div>
      );
    }
    case "booking-cta":
      return (
        <div className="grid gap-3">
          <BilingualField
            label={labels.title}
            value={draft.title}
            onChange={(title) => onChange({ title })}
          />
          <BilingualField
            label={labels.subtitle}
            value={draft.subtitle}
            onChange={(subtitle) => onChange({ subtitle })}
            multiline
          />
          <BilingualField
            label={labels.buttonLabel}
            value={draft.buttonLabel}
            onChange={(buttonLabel) => onChange({ buttonLabel })}
          />
        </div>
      );
    default:
      // services, barbers, opening-hours, location, contact: heading overrides only
      return (
        <div className="grid gap-3">
          <BilingualField
            label={labels.title}
            value={draft.title}
            onChange={(title) => onChange({ title })}
          />
          <BilingualField
            label={labels.subtitle}
            value={draft.subtitle}
            onChange={(subtitle) => onChange({ subtitle })}
            multiline
          />
        </div>
      );
  }
}
