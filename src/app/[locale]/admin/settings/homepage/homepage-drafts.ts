import type { HomepageSection } from "@/lib/validation/shop-config";

/**
 * Editor draft shapes for homepage section content. Shared between the
 * server page (stored rows -> drafts) and the client editor (drafts ->
 * action payload). Plain strings only; blanks are legal everywhere.
 */

export type LocalizedDraft = { en: string; ne?: string };

export interface ImageDraft {
  url: string;
  alt: LocalizedDraft;
}
export interface WhyUsItemDraft {
  title: LocalizedDraft;
  description: LocalizedDraft;
}
export interface TestimonialDraft {
  quote: LocalizedDraft;
  author: string;
  role: LocalizedDraft;
}
export interface FaqDraft {
  question: LocalizedDraft;
  answer: LocalizedDraft;
}

export interface ContentDraft {
  headline?: LocalizedDraft;
  subheadline?: LocalizedDraft;
  imageUrl?: string;
  ctaLabel?: LocalizedDraft;
  secondaryCtaLabel?: LocalizedDraft;
  title?: LocalizedDraft;
  subtitle?: LocalizedDraft;
  serviceId?: string;
  body?: LocalizedDraft;
  buttonLabel?: LocalizedDraft;
  whyUsItems: WhyUsItemDraft[];
  galleryImages: ImageDraft[];
  testimonials: TestimonialDraft[];
  faqItems: FaqDraft[];
}

export interface SectionDraft {
  type: string;
  enabled: boolean;
  content: ContentDraft;
}

export interface ServiceOption {
  id: string;
  label: string;
}

function copyLocalized(value: { en: string; ne?: string } | undefined): LocalizedDraft | undefined {
  return value ? { ...value } : undefined;
}

/** Stored rows only ever carry validated shapes, so plain field picks are safe. */
export function toEditorDrafts(sections: HomepageSection[]): SectionDraft[] {
  return sections.map((section) => {
    const c: ContentDraft = {
      whyUsItems: [],
      galleryImages: [],
      testimonials: [],
      faqItems: [],
    };
    switch (section.type) {
      case "hero":
        c.headline = copyLocalized(section.content.headline);
        c.subheadline = copyLocalized(section.content.subheadline);
        c.imageUrl = section.content.imageUrl;
        c.ctaLabel = copyLocalized(section.content.ctaLabel);
        c.secondaryCtaLabel = copyLocalized(section.content.secondaryCtaLabel);
        break;
      case "services":
      case "barbers":
      case "opening-hours":
      case "location":
      case "contact":
        c.title = copyLocalized(section.content.title);
        c.subtitle = copyLocalized(section.content.subtitle);
        break;
      case "featured-service":
        c.serviceId = section.content.serviceId;
        c.title = copyLocalized(section.content.title);
        c.subtitle = copyLocalized(section.content.subtitle);
        break;
      case "about":
        c.body = copyLocalized(section.content.body);
        c.imageUrl = section.content.imageUrl;
        break;
      case "why-us":
        c.whyUsItems = (section.content.items ?? []).map((item) => ({
          title: { ...item.title },
          description: item.description ? { ...item.description } : { en: "" },
        }));
        break;
      case "gallery":
        c.galleryImages = (section.content.images ?? []).map((image) => ({
          url: image.url,
          alt: image.alt ? { ...image.alt } : { en: "" },
        }));
        break;
      case "testimonials":
        c.testimonials = (section.content.items ?? []).map((item) => ({
          quote: { ...item.quote },
          author: item.author,
          role: item.role ? { ...item.role } : { en: "" },
        }));
        break;
      case "faq":
        c.faqItems = (section.content.items ?? []).map((item) => ({
          question: { ...item.question },
          answer: { ...item.answer },
        }));
        break;
      case "booking-cta":
        c.title = copyLocalized(section.content.title);
        c.subtitle = copyLocalized(section.content.subtitle);
        c.buttonLabel = copyLocalized(section.content.buttonLabel);
        break;
    }
    return { type: section.type, enabled: section.enabled, content: c };
  });
}
