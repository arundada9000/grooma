import { getLocale, getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { getShopContext } from "@/lib/tenant";
import { getActiveBarbers, getActiveServices } from "@/db/repositories/public";
import { loadWorkingHours } from "@/db/repositories/booking";
import type { HomepageSection } from "@/lib/validation/shop-config";
import {
  AboutSection,
  BarbersSection,
  BookingCtaSection,
  ContactSection,
  HeroSection,
  LocationSection,
  OpeningHoursSection,
  ServicesSection,
} from "@/components/home/sections";

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

  return (
    <div className="pb-4">
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
        />
      );
    case "services":
      return (
        <ServicesSection
          services={data.services}
          locale={data.locale}
          viewAllHref={data.servicesHref}
        />
      );
    case "barbers":
      return (
        <BarbersSection
          barbers={data.barbers}
          locale={data.locale}
          viewAllHref={data.barbersHref}
        />
      );
    case "about":
      return <AboutSection description={data.shop.description} />;
    case "opening-hours":
      return <OpeningHoursSection hours={data.hours} />;
    case "location":
      return <LocationSection location={data.shop.location} />;
    case "contact":
      return <ContactSection contact={data.shop.contact} />;
    case "booking-cta":
      return <BookingCtaSection bookHref={data.bookHref} />;
    // Content authored sections (gallery, testimonials, faq, featured)
    // render once the homepage editor phase ships their content model.
    default:
      return null;
  }
}
