import type { Metadata } from "next";
import { getLocale, getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/i18n/format";
import { requireOwner } from "@/lib/auth/session";
import { getCustomerHistory, listCustomers, type CustomerSummary } from "@/db/repositories/admin";
import { CustomerCard, CustomerHistoryDrawer } from "./customer-parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.customersPage.title") };
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [session, locale, { t }, params] = await Promise.all([
    requireOwner(),
    getLocale(),
    getTranslator(),
    searchParams,
  ]);

  const search = params.q?.trim() || undefined;
  const customers = await listCustomers(session.user.shopId, search);

  // History is fetched for the rendered page only; counts stay small.
  const historyByCustomer = new Map<string, Awaited<ReturnType<typeof getCustomerHistory>>>();
  if (customers.length <= 50) {
    await Promise.all(
      customers.map(async (customer) => {
        historyByCustomer.set(
          customer.id,
          await getCustomerHistory(session.user.shopId, customer.id),
        );
      }),
    );
  }

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.customersPage.title")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">{t("admin.customersPage.subtitle")}</p>

      <form action={`/${locale}/admin/customers`} className="mt-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder={t("admin.customersPage.search")}
          className="bg-inset ring-separator focus:ring-accent placeholder:text-label-tertiary min-w-0 flex-1 rounded-xl px-4 py-2.5 text-[15px] ring-1 transition-shadow outline-none"
        />
        <button
          type="submit"
          className="bg-accent-soft text-accent inline-flex h-11 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          {t("admin.customersPage.search")}
        </button>
      </form>

      <ul className="mt-5 space-y-2 pb-6">
        {customers.length === 0 ? (
          <p className="text-label-tertiary py-6 text-sm">
            {search ? t("admin.customersPage.noMatch") : t("admin.customersPage.empty")}
          </p>
        ) : (
          customers.map((customer) => (
            <CustomerListItem
              key={customer.id}
              customer={customer}
              history={historyByCustomer.get(customer.id) ?? []}
              locale={locale as Locale}
            />
          ))
        )}
      </ul>
    </div>
  );
}

async function CustomerListItem({
  customer,
  history,
  locale,
}: {
  customer: CustomerSummary;
  history: Awaited<ReturnType<typeof getCustomerHistory>>;
  locale: Locale;
}) {
  const { t } = await getTranslator();

  return (
    <li>
      <CustomerHistoryDrawer
        customerName={customer.name}
        customerPhone={customer.phone}
        trigger={
          <CustomerCard
            name={customer.name}
            phone={customer.phone}
            visitsLabel={t(
              customer.visitCount === 1 ? "admin.customersPage.visits_one" : "admin.customersPage.visits_other",
              { count: customer.visitCount },
            )}
            lastSeenLabel={
              customer.lastVisitMs == null
                ? null
                : t("admin.customersPage.lastSeen", {
                    date: formatDate(customer.lastVisitMs, locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  })
            }
          />
        }
        historyTitle={t("admin.customersPage.historyTitle")}
        emptyLabel={t("admin.customersPage.noHistory")}
      >
        {history.length === 0 ? null : (
          <ul className="space-y-2">
            {history.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="text-label truncate text-[15px] font-medium">
                    {row.serviceName.en}
                  </p>
                  <p className="text-label-secondary text-[13px] tabular-nums">
                    {formatDate(row.startMs, locale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {row.barberName}
                  </p>
                </div>
                <span
                  className={
                    row.status === "CANCELLED" || row.status === "NO_SHOW"
                      ? "text-destructive shrink-0 text-xs font-semibold uppercase"
                      : "text-label-secondary shrink-0 text-xs font-semibold uppercase"
                  }
                >
                  {t(`manage.status_${row.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CustomerHistoryDrawer>
    </li>
  );
}
