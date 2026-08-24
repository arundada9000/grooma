import type { Metadata } from "next";
import { getLocale, getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { getShopContext } from "@/lib/tenant";
import { getActiveBarbers, getActiveServices } from "@/db/repositories/public";
import { loadWorkingHours } from "@/db/repositories/booking";
import { buildPageMetadata, faqJsonLd, localBusinessJsonLd } from "@/lib/seo/profile";
import { getSiteUrl } from "@/lib/seo/site-url";
import { JsonLd } from "@/components/seo/json-ld";
import type { HomepageSection } from "@/lib/validation/shop-config";
import {
  AboutSection,
  BarbersSection,
  BookingCtaSection,
  ContactSection,
  FaqSection,
  FeaturedServiceSection,
  GallerySection,
  HeroSection,
  LocationSection,
  OpeningHoursSection,
  ServicesSection,
  TestimonialsSection,
  WhyUsSection,
} from "@/components/home/sections";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, locale, { t }] = await Promise.all([getShopContext(), getLocale(), getTranslator()]);
  return buildPageMetadata({
    shopName: shop.name,
    tagline: shop.tagline,
    locale,
    path: "/",
    title: t("meta.titleDefault"),
  });
}

export default async function HomePage() {
  const shop = await getShopContext();
  const locale = await getLocale();
  const { t } = await getTranslator();

  const [services, barbers, hours] = await Promise.all([
    getActiveServices(shop.id),
    getActiveBarbers(shop.id),
    loadWorkingHours(shop.id),
  ]);

  const bookHref = `/${locale}/book`;
  const servicesHref = `/${locale}/services`;
  const barbersHref = `/${locale}/barbers`;

  const enabled = shop.homepage.sections.filter((section) => section.enabled);
  const faqItems = enabled.find((section) => section.type === "faq")?.content.items ?? [];

  return (
    <div className="pb-4">
      <JsonLd
        data={localBusinessJsonLd(
          {
            name: shop.name,
            tagline: shop.tagline,
            description: shop.description,
            contact: shop.contact,
            location: shop.location,
            social: shop.social,
            currency: shop.currency,
          },
          hours.filter((row) => row.barberId == null),
          { siteUrl: getSiteUrl(), locale },
        )}
      />
      {faqItems.length > 0 ? <JsonLd data={faqJsonLd(faqItems, locale)} /> : null}
      {enabled.map((section, index) => (
        <HomepageSectionRenderer
          key={`${section.type}-${index}`}
          section={section}
          data={{
            shop,
            services,
            barbers,
            hours,
            bookHref,
            servicesHref,
            barbersHref,
            locale,
            heroLabels: { cta: t("home.heroCta"), secondary: t("home.heroSecondary") },
          }}
        />
      ))}
    </div>
  );
}

interface SectionData {
  shop: Awaited<ReturnType<typeof getShopContext>>;
  services: Awaited<ReturnType<typeof getActiveServices>>;
  barbers: Awaited<ReturnType<typeof getActiveBarbers>>;
  hours: Awaited<ReturnType<typeof loadWorkingHours>>;
  bookHref: string;
  servicesHref: string;
  barbersHref: string;
  locale: Locale;
  heroLabels: { cta: string; secondary: string };
}

function HomepageSectionRenderer({
  section,
  data,
}: {
  section: HomepageSection;
  data: SectionData;
}) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          name={data.shop.name}
          tagline={data.shop.tagline}
          bookHref={data.bookHref}
          browseHref={data.servicesHref}
          labels={data.heroLabels}
          locale={data.locale}
          content={section.content}
        />
      );
    case "services":
      return (
        <ServicesSection
          services={data.services}
          locale={data.locale}
          viewAllHref={data.servicesHref}
          content={section.content}
        />
      );
    case "featured-service": {
      const featured = section.content.serviceId
        ? data.services.find((service) => service.id === section.content.serviceId)
        : undefined;
      if (!featured) return null;
      return (
        <FeaturedServiceSection
          service={featured}
          locale={data.locale}
          bookHref={data.bookHref}
          content={section.content}
        />
      );
    }
    case "barbers":
      return (
        <BarbersSection
          barbers={data.barbers}
          locale={data.locale}
          viewAllHref={data.barbersHref}
          content={section.content}
        />
      );
    case "about":
      return (
        <AboutSection
          description={data.shop.description}
          locale={data.locale}
          content={section.content}
        />
      );
    case "why-us":
      return <WhyUsSection locale={data.locale} content={section.content} />;
    case "gallery":
      return <GallerySection locale={data.locale} content={section.content} />;
    case "testimonials":
      return <TestimonialsSection locale={data.locale} content={section.content} />;
    case "faq":
      return <FaqSection locale={data.locale} content={section.content} />;
    case "opening-hours":
      return (
        <OpeningHoursSection hours={data.hours} locale={data.locale} content={section.content} />
      );
    case "location":
      return (
        <LocationSection
          location={data.shop.location}
          locale={data.locale}
          content={section.content}
        />
      );
    case "contact":
      return (
        <ContactSection
          contact={data.shop.contact}
          locale={data.locale}
          content={section.content}
        />
      );
    case "booking-cta":
      return (
        <BookingCtaSection
          bookHref={data.bookHref}
          locale={data.locale}
          content={section.content}
        />
      );
    default:
      return null;
  }
}
