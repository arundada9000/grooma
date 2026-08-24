import { z } from "zod";
import {
  wallClockTimeSchema,
  weekdaySchema,
  workingIntervalSchema,
} from "@/lib/validation/schedule";
import {
  bookingRulesSchema,
  type FaqItem,
  type HomepageImage,
  type TestimonialItem,
  type WhyUsItem,
} from "@/lib/validation/shop-config";
import type { LocalizedText } from "@/i18n/localized-text";

/**
 * Admin authored input shapes. LocalizedText editors submit en (required)
 * and ne (optional); empty ne collapses to undefined so the fallback path
 * in resolveLocalizedText keeps working.
 */

export const localizedInputSchema = z.object({
  en: z.string().trim().min(1).max(160),
  ne: z.string().trim().max(160).optional(),
});
export type LocalizedInput = z.infer<typeof localizedInputSchema>;

export const optionalLocalizedInputSchema = z.object({
  en: z.string().trim().min(1).max(400),
  ne: z.string().trim().max(400).optional(),
});

export const serviceInputSchema = z.object({
  name: localizedInputSchema,
  description: optionalLocalizedInputSchema.optional(),
  durationMinutes: z.number().int().min(5).max(480),
  bufferMinutes: z.number().int().min(0).max(120),
  priceCents: z.number().int().min(0).max(100_000_000),
});

export const barberInputSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: optionalLocalizedInputSchema.optional(),
});

export const dayHoursInputSchema = z.array(
  z.object({
    weekday: weekdaySchema,
    intervals: z.array(workingIntervalSchema).max(4),
  }),
);

export const breakInputSchema = z
  .object({
    barberId: z.uuid().nullable(),
    kind: z.enum(["RECURRING", "ONE_OFF"]),
    weekday: weekdaySchema.nullable(),
    oneOffDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    startTime: wallClockTimeSchema,
    endTime: wallClockTimeSchema,
    reason: z.string().trim().max(200).nullable(),
  })
  .refine((input) => input.startTime < input.endTime, { message: "End must be after start" })
  .refine(
    (input) => (input.kind === "RECURRING" ? input.weekday !== null : input.oneOffDate !== null),
    {
      message: "Recurring needs a weekday; one-off needs a date",
    },
  );

export const closureInputSchema = z
  .object({
    barberId: z.uuid().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fullDay: z.boolean(),
    startTime: wallClockTimeSchema.nullable(),
    endTime: wallClockTimeSchema.nullable(),
    reason: z.string().trim().max(200).nullable(),
  })
  .refine((input) => input.startDate <= input.endDate, { message: "End date before start date" })
  .refine(
    (input) =>
      input.fullDay
        ? true
        : input.startTime !== null && input.endTime !== null && input.startTime < input.endTime,
    {
      message: "Partial closures need a start and end time",
    },
  );

export const shopProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  shortName: z.string().trim().max(60).optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contact: z
    .object({
      phone: z.string().trim().min(3).max(32),
      email: z.email().max(255).optional(),
      whatsapp: z.string().trim().max(32).optional(),
      website: z.url().max(255).optional(),
    })
    .optional(),
  location: z
    .object({
      addressLine: z.string().trim().min(1).max(255),
      city: z.string().trim().min(1).max(120),
      province: z.string().trim().max(120).optional(),
      country: z.string().trim().min(1).max(120),
      postalCode: z.string().trim().max(20).optional(),
      mapsUrl: z.url().max(500).optional(),
    })
    .optional(),
  social: z
    .object({
      facebook: z.url().max(255).optional(),
      instagram: z.url().max(255).optional(),
      tiktok: z.url().max(255).optional(),
      twitter: z.url().max(255).optional(),
      youtube: z.url().max(255).optional(),
    })
    .optional(),
});

export { bookingRulesSchema };

/**
 * Homepage section content inputs. The editor submits every field as plain
 * strings, so blank fields collapse to undefined, repeater rows missing a
 * required value are dropped, and Nepali without English is rejected
 * (English is the fallback language for the whole surface).
 */

export const homepageLocalizedInputSchema = z
  .object({
    en: z.string().max(600),
    ne: z.string().max(600).optional(),
  })
  .refine((value) => !value.ne?.trim() || value.en.trim().length > 0, {
    message: "Fill in the English text before the Nepali text",
  })
  .transform((value): LocalizedText | undefined => {
    const en = value.en.trim();
    if (!en) return undefined;
    const ne = value.ne?.trim();
    return ne ? { en, ne } : { en };
  });

export const homepageUrlInputSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .pipe(z.url().max(500).optional());

export const homepageUuidInputSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .pipe(z.uuid().optional());

const whyUsItemInputSchema = z
  .object({
    title: homepageLocalizedInputSchema,
    description: homepageLocalizedInputSchema.optional(),
  })
  .transform((item): WhyUsItem | undefined => {
    if (!item.title) return undefined;
    return item.description
      ? { title: item.title, description: item.description }
      : { title: item.title };
  });

const testimonialItemInputSchema = z
  .object({
    quote: homepageLocalizedInputSchema,
    author: z.string().trim().max(120),
    role: homepageLocalizedInputSchema.optional(),
  })
  .transform((item): TestimonialItem | undefined => {
    if (!item.quote || !item.author) return undefined;
    return item.role
      ? { quote: item.quote, author: item.author, role: item.role }
      : { quote: item.quote, author: item.author };
  });

const faqItemInputSchema = z
  .object({
    question: homepageLocalizedInputSchema,
    answer: homepageLocalizedInputSchema,
  })
  .transform((item): FaqItem | undefined => {
    return item.question && item.answer
      ? { question: item.question, answer: item.answer }
      : undefined;
  });

const galleryImageInputSchema = z
  .object({
    url: homepageUrlInputSchema,
    alt: homepageLocalizedInputSchema.optional(),
  })
  .transform((image): HomepageImage | undefined => {
    if (!image.url) return undefined;
    return image.alt ? { url: image.url, alt: image.alt } : { url: image.url };
  });

function kept<T>(items: Array<T | undefined>): T[] | undefined {
  const list = items.filter((item): item is T => item !== undefined);
  return list.length > 0 ? list : undefined;
}

const headingContentInputShape = {
  title: homepageLocalizedInputSchema.optional(),
  subtitle: homepageLocalizedInputSchema.optional(),
};

export const homepageConfigInputSchema = z.object({
  sections: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("hero"),
        enabled: z.boolean(),
        content: z
          .object({
            headline: homepageLocalizedInputSchema.optional(),
            subheadline: homepageLocalizedInputSchema.optional(),
            imageUrl: homepageUrlInputSchema.optional(),
            ctaLabel: homepageLocalizedInputSchema.optional(),
            secondaryCtaLabel: homepageLocalizedInputSchema.optional(),
          })
          .default({}),
      }),
      z.object({
        type: z.literal("services"),
        enabled: z.boolean(),
        content: z.object({ ...headingContentInputShape }).default({}),
      }),
      z.object({
        type: z.literal("featured-service"),
        enabled: z.boolean(),
        content: z
          .object({
            serviceId: homepageUuidInputSchema.optional(),
            ...headingContentInputShape,
          })
          .default({}),
      }),
      z.object({
        type: z.literal("barbers"),
        enabled: z.boolean(),
        content: z.object({ ...headingContentInputShape }).default({}),
      }),
      z.object({
        type: z.literal("about"),
        enabled: z.boolean(),
        content: z
          .object({
            body: homepageLocalizedInputSchema.optional(),
            imageUrl: homepageUrlInputSchema.optional(),
          })
          .default({}),
      }),
      z.object({
        type: z.literal("why-us"),
        enabled: z.boolean(),
        content: z
          .object({
            items: z.array(whyUsItemInputSchema).max(6).transform(kept).optional(),
          })
          .default({}),
      }),
      z.object({
        type: z.literal("gallery"),
        enabled: z.boolean(),
        content: z
          .object({
            images: z.array(galleryImageInputSchema).max(12).transform(kept).optional(),
          })
          .default({}),
      }),
      z.object({
        type: z.literal("testimonials"),
        enabled: z.boolean(),
        content: z
          .object({
            items: z.array(testimonialItemInputSchema).max(9).transform(kept).optional(),
          })
          .default({}),
      }),
      z.object({
        type: z.literal("faq"),
        enabled: z.boolean(),
        content: z
          .object({
            items: z.array(faqItemInputSchema).max(10).transform(kept).optional(),
          })
          .default({}),
      }),
      z.object({
        type: z.literal("opening-hours"),
        enabled: z.boolean(),
        content: z.object({ ...headingContentInputShape }).default({}),
      }),
      z.object({
        type: z.literal("location"),
        enabled: z.boolean(),
        content: z.object({ ...headingContentInputShape }).default({}),
      }),
      z.object({
        type: z.literal("contact"),
        enabled: z.boolean(),
        content: z.object({ ...headingContentInputShape }).default({}),
      }),
      z.object({
        type: z.literal("booking-cta"),
        enabled: z.boolean(),
        content: z
          .object({
            title: homepageLocalizedInputSchema.optional(),
            subtitle: homepageLocalizedInputSchema.optional(),
            buttonLabel: homepageLocalizedInputSchema.optional(),
          })
          .default({}),
      }),
    ]),
  ),
});
