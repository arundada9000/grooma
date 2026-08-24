import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ContactInfo, LocationInfo } from "@/lib/validation/shop-config";
import type { WorkingHoursRecord } from "@/lib/scheduling/types";
import { currentInstantMs, epochToZonedParts } from "@/lib/scheduling/format";
import { SHOP_TIME_ZONE, formatCurrency } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { resolveLocalizedText } from "@/i18n/localized-text";
import { getTranslator } from "@/i18n/server";
import type { PublicBarber, PublicService } from "@/db/repositories/public";

/**
 * Homepage section renderers. Each enabled section of shop.homepage
 * maps to one of these; they read live catalog data passed down by the
 * page so the whole page costs three queries regardless of sections.
 */

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-label text-[22px] font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-label-secondary mt-0.5 text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function HeroSection({
  name,
  tagline,
  bookHref,
  browseHref,
  labels,
}: {
  name: string;
  tagline: string | null;
  bookHref: string;
  browseHref: string;
  labels: { cta: string; secondary: string };
}) {
  return (
    <section className="px-4 pt-14 pb-10 text-center">
      <p aria-hidden="true" className="bg-accent mx-auto mb-5 h-1 w-12 rounded-full" />
      <h1 className="text-label mx-auto max-w-md text-4xl font-semibold tracking-tight text-balance">
        {name}
      </h1>
      {tagline ? (
        <p className="text-label-secondary mx-auto mt-3 max-w-sm text-lg text-balance">{tagline}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={bookHref}
          className={cn(
            "bg-accent text-on-accent",
            "inline-flex h-12 items-center rounded-full px-6 text-base font-medium",
            "transition-transform duration-150 ease-out active:scale-[0.96]",
          )}
        >
          {labels.cta}
        </Link>
        <Link
          href={browseHref}
          className="border-separator text-label inline-flex h-12 items-center rounded-full border px-6 text-base font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          {labels.secondary}
        </Link>
      </div>
    </section>
  );
}

export async function ServicesSection({
  services,
  locale,
  viewAllHref,
}: {
  services: PublicService[];
  locale: Locale;
  viewAllHref: string;
}) {
  const { t } = await getTranslator();
  if (services.length === 0) return null;
  return (
    <section className="px-4 py-6">
      <SectionHeading
        title={t("home.servicesTitle")}
        subtitle={t("home.servicesSubtitle")}
        action={
          <Link href={viewAllHref} className="text-accent shrink-0 text-sm font-medium">
            {t("home.viewServices")}
          </Link>
        }
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {services.slice(0, 4).map((service) => {
          const name = resolveLocalizedText(service.name, locale);
          const description = resolveLocalizedText(service.description, locale);
          return (
            <li key={service.id}>
              <Link
                href={`/book?service=${service.id}`}
                className="bg-card shadow-card ring-separator block rounded-2xl p-4 ring-1 transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-label font-semibold">{name}</h3>
                  <span className="text-accent shrink-0 text-sm font-semibold">
                    {formatCurrency(service.priceCents, locale)}
                  </span>
                </div>
                {description ? (
                  <p className="text-label-secondary mt-1 line-clamp-2 text-sm">{description}</p>
                ) : null}
                <p className="text-label-tertiary mt-2 text-[13px]">
                  {t("servicesPage.minutes", { minutes: service.durationMinutes })}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function BarbersSection({
  barbers,
  locale,
  viewAllHref,
}: {
  barbers: PublicBarber[];
  locale: Locale;
  viewAllHref: string;
}) {
  const { t } = await getTranslator();
  if (barbers.length === 0) return null;
  return (
    <section className="px-4 py-6">
      <SectionHeading
        title={t("home.barbersTitle")}
        subtitle={t("home.barbersSubtitle")}
        action={
          <Link href={viewAllHref} className="text-accent shrink-0 text-sm font-medium">
            {t("home.viewBarbers")}
          </Link>
        }
      />
      <ul className="grid gap-3 sm:grid-cols-3">
        {barbers.slice(0, 3).map((barber) => {
          const bio = resolveLocalizedText(barber.bio, locale);
          return (
            <li key={barber.id}>
              <Link
                href={`/book?barber=${barber.id}`}
                className="bg-card shadow-card ring-separator flex h-full flex-col rounded-2xl p-4 ring-1 transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                <span
                  aria-hidden="true"
                  className="bg-accent-soft text-accent ring-accent/20 mb-3 flex size-11 items-center justify-center rounded-full text-base font-semibold ring-1"
                >
                  {initials(barber.displayName)}
                </span>
                <h3 className="text-label font-semibold">{barber.displayName}</h3>
                {bio ? (
                  <p className="text-label-secondary mt-1 line-clamp-3 text-sm">{bio}</p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function AboutSection({ description }: { description: string | null }) {
  const { t } = await getTranslator();
  if (!description) return null;
  return (
    <section className="px-4 py-6">
      <SectionHeading title={t("home.aboutTitle")} />
      <p className="text-label-secondary text-[15px] leading-relaxed">{description}</p>
    </section>
  );
}

export async function OpeningHoursSection({ hours }: { hours: WorkingHoursRecord[] }) {
  const { t } = await getTranslator();
  const shopRows = hours.filter((row) => row.barberId === null);
  if (shopRows.length === 0) return null;

  // Merge duplicate weekday rows into one interval list per day, then
  // highlight the current day in the shop zone.
  const byDay = new Map<number, string[]>();
  for (const row of shopRows) {
    const list = byDay.get(row.weekday) ?? [];
    for (const interval of row.intervals) list.push(`${interval.start}–${interval.end}`);
    byDay.set(row.weekday, list);
  }
  const todayWeekday = epochToZonedParts(SHOP_TIME_ZONE, currentInstantMs()).weekday;
  const weekdayKeys = [
    "weekdays.long0",
    "weekdays.long1",
    "weekdays.long2",
    "weekdays.long3",
    "weekdays.long4",
    "weekdays.long5",
    "weekdays.long6",
  ] as const;

  return (
    <section className="px-4 py-6">
      <SectionHeading title={t("home.openingHoursTitle")} />
      <div className="bg-card shadow-card ring-separator overflow-hidden rounded-2xl ring-1">
        <dl>
          {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
            const intervals = byDay.get(weekday);
            const isToday = weekday === todayWeekday;
            return (
              <div
                key={weekday}
                className={cn(
                  "border-separator flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0",
                  isToday && "bg-accent-soft/40",
                )}
              >
                <dt
                  className={cn(
                    "text-[15px]",
                    isToday ? "text-label font-semibold" : "text-label-secondary",
                  )}
                >
                  {t(weekdayKeys[weekday])}
                </dt>
                <dd className={cn("text-[15px]", intervals ? "text-label" : "text-label-tertiary")}>
                  {intervals?.join(", ") ?? t("home.closedToday")}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

export async function LocationSection({ location }: { location: LocationInfo }) {
  const { t } = await getTranslator();
  const query =
    location.latitude != null && location.longitude != null
      ? `${location.latitude},${location.longitude}`
      : encodeURIComponent([location.addressLine, location.city, location.country].join(", "));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <section className="px-4 py-6">
      <SectionHeading title={t("home.locationTitle")} />
      <div className="bg-card shadow-card ring-separator rounded-2xl p-4 ring-1">
        <p className="text-label text-[15px] leading-relaxed">
          {location.addressLine}
          <br />
          {[location.city, location.province, location.country].filter(Boolean).join(", ")}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "bg-accent-soft text-accent",
            "mt-3 inline-flex h-10 items-center rounded-full px-4 text-sm font-medium",
            "transition-transform duration-150 ease-out active:scale-[0.96]",
          )}
        >
          {t("home.directions")}
        </a>
      </div>
    </section>
  );
}

export async function ContactSection({ contact }: { contact: ContactInfo }) {
  const { t } = await getTranslator();
  const tel = contact.phone.replace(/[^+\d]/g, "");
  const chipClass = cn(
    "bg-card shadow-card ring-separator flex min-w-0 flex-col gap-0.5 rounded-2xl p-4 ring-1",
    "transition-colors duration-150 hover:bg-inset",
  );

  return (
    <section className="px-4 py-6">
      <SectionHeading title={t("home.contactTitle")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <a href={`tel:${tel}`} className={chipClass}>
          <span className="text-label-tertiary text-xs font-medium tracking-wide uppercase">
            {t("home.call")}
          </span>
          <span className="text-label truncate text-[15px] font-medium">{contact.phone}</span>
        </a>
        {contact.whatsapp ? (
          <a
            href={`https://wa.me/${contact.whatsapp.replace(/[^+\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={chipClass}
          >
            <span className="text-label-tertiary text-xs font-medium tracking-wide uppercase">
              {t("home.whatsapp")}
            </span>
            <span className="text-label truncate text-[15px] font-medium">{contact.whatsapp}</span>
          </a>
        ) : null}
        {contact.email ? (
          <a href={`mailto:${contact.email}`} className={chipClass}>
            <span className="text-label-tertiary text-xs font-medium tracking-wide uppercase">
              {t("home.email")}
            </span>
            <span className="text-label truncate text-[15px] font-medium">{contact.email}</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}

export async function BookingCtaSection({ bookHref }: { bookHref: string }) {
  const { t } = await getTranslator();
  return (
    <section className="px-4 py-8">
      <div className="from-accent/10 to-background ring-accent/20 rounded-3xl bg-gradient-to-b p-8 text-center ring-1">
        <h2 className="text-label text-2xl font-semibold tracking-tight">{t("home.ctaTitle")}</h2>
        <p className="text-label-secondary mt-2 text-[15px]">{t("home.ctaSubtitle")}</p>
        <Link
          href={bookHref}
          className="bg-accent text-on-accent mt-6 inline-flex h-12 items-center rounded-full px-8 text-base font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          {t("home.ctaButton")}
        </Link>
      </div>
    </section>
  );
}
