"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Slot } from "@/lib/scheduling/types";
import { minuteOfDayToHHMM } from "@/lib/scheduling/format";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatDateTime } from "@/i18n/format";
import type { BookingErrorCode } from "@/lib/booking/types";
import { createBookingAction } from "@/lib/booking/actions";
import { SlotPicker, type SlotPickerLabels } from "./slot-picker";

/**
 * The booking wizard: SERVICE → BARBER → TIME → DETAILS → REVIEW → done.
 * Availability loads per seven day chunk through the server action; a
 * lost race (SLOT_UNAVAILABLE) shows the conflict banner and refreshes
 * slots instead of bouncing the customer out of the flow.
 */

export interface WizardService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
}

export interface WizardBarber {
  id: string;
  displayName: string;
}

export interface BookingWizardProps {
  locale: Locale;
  services: WizardService[];
  barbersByService: Record<string, WizardBarber[]>;
  /** Bookable days grouped into chunks of seven, oldest first. */
  chunks: string[][];
  prefillServiceId: string | null;
  prefillBarberId: string | null;
  labels: {
    title: string;
    progressLabel: string;
    steps: [string, string, string, string, string];
    chooseService: string;
    chooseBarber: string;
    anyBarber: string;
    anyBarberHint: string;
    yourDetails: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailOptional: string;
    notes: string;
    notesOptional: string;
    notesPlaceholder: string;
    review: string;
    serviceLabel: string;
    barberLabel: string;
    whenLabel: string;
    priceLabel: string;
    confirmAndBook: string;
    back: string;
    next: string;
    edit: string;
    confirming: string;
    confirmed: string;
    confirmedSubtitle: string;
    addToCalendar: string;
    manageBooking: string;
    conflictTitle: string;
    conflictMessage: string;
    invalidField: string;
    picker: SlotPickerLabels;
    errorMessages: Record<BookingErrorCode | "generic", string>;
    ruleViolations: Record<"PAST" | "MIN_NOTICE" | "MAX_ADVANCE", string>;
  };
}

type Step = 0 | 1 | 2 | 3 | 4;

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY_FORM: CustomerForm = { name: "", phone: "", email: "", notes: "" };

export function BookingWizard(props: BookingWizardProps) {
  const { services, barbersByService, locale, labels } = props;

  const [step, setStep] = useState<Step>(props.prefillServiceId ? 1 : 0);
  const [serviceId, setServiceId] = useState<string | null>(props.prefillServiceId);
  const [barberId, setBarberId] = useState<string>(
    props.prefillBarberId === "ANY" || props.prefillBarberId != null
      ? props.prefillBarberId
      : "ANY",
  );
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ title: string; message: string } | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  const service = services.find((item) => item.id === serviceId) ?? null;
  const eligibleBarbers = serviceId != null ? (barbersByService[serviceId] ?? []) : [];

  const detailsValid =
    form.name.trim().length >= 2 &&
    /^[+()\-\s\d]{6,32}$/.test(form.phone.trim()) &&
    (form.email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return serviceId != null;
      case 1:
        return barberId !== "ANY" || eligibleBarbers.length > 0;
      case 2:
        return dateKey != null && startMs != null;
      case 3:
        return detailsValid;
      default:
        return true;
    }
  })();

  function failureMessage(
    code: BookingErrorCode,
    detail?: string,
  ): { title: string; message: string } {
    if (code === "SLOT_UNAVAILABLE") {
      return { title: labels.conflictTitle, message: labels.conflictMessage };
    }
    if (code === "RULE_VIOLATION" && detail != null && detail in labels.ruleViolations) {
      const key = detail as keyof typeof labels.ruleViolations;
      return { title: labels.conflictTitle, message: labels.ruleViolations[key] };
    }
    return {
      title: labels.conflictTitle,
      message: labels.errorMessages[code] ?? labels.errorMessages.generic,
    };
  }

  async function handleConfirm() {
    if (service == null || dateKey == null || startMs == null || startMinute == null) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await createBookingAction({
        serviceId: service.id,
        barberId,
        dateKey,
        time: minuteOfDayToHHMM(startMinute),
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
        },
        notes: form.notes.trim() ? form.notes.trim() : undefined,
      });
      if (result.ok) {
        setConfirmedToken(result.lookupToken);
        window.scrollTo({ top: 0 });
      } else {
        setBanner(failureMessage(result.code, result.detail));
        if (
          result.code === "SLOT_UNAVAILABLE" ||
          result.code === "RULE_VIOLATION" ||
          result.code === "MAX_DAILY_REACHED"
        ) {
          setRefreshSignal((signal) => signal + 1);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedToken != null && service != null && startMs != null) {
    return (
      <Confirmation
        token={confirmedToken}
        service={service}
        startMs={startMs}
        locale={locale}
        labels={labels}
      />
    );
  }

  return (
    <div className="px-4 py-8">
      <header>
        <h1 className="text-label text-[32px] font-semibold tracking-tight">{labels.title}</h1>
        <p className="text-label-secondary mt-1 text-[15px]">
          {labels.progressLabel.replace("{current}", String(step + 1)).replace("{total}", "5")}
        </p>
        <ol className="mt-4 flex gap-1.5">
          {labels.steps.map((name, index) => (
            <li key={name} className="flex-1">
              <span
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "block h-1 rounded-full transition-colors duration-200",
                  index <= step ? "bg-accent" : "bg-separator",
                )}
              />
              <span
                className={cn(
                  "mt-1.5 hidden text-xs font-medium sm:block",
                  index === step ? "text-label" : "text-label-tertiary",
                )}
              >
                {name}
              </span>
            </li>
          ))}
        </ol>
      </header>

      {banner ? (
        <div
          role="alert"
          className="bg-destructive-soft text-on-destructive-soft mt-5 rounded-2xl p-4"
        >
          <p className="font-semibold">{banner.title}</p>
          <p className="mt-0.5 text-sm">{banner.message}</p>
        </div>
      ) : null}

      <div className="mt-6">
        {step === 0 ? (
          <section aria-label={labels.chooseService}>
            <h2 className="text-label mb-3 text-lg font-semibold">{labels.chooseService}</h2>
            <ul className="grid gap-3">
              {services.map((item) => (
                <li key={item.id}>
                  <SelectableCard
                    selected={item.id === serviceId}
                    onSelect={() => {
                      setServiceId(item.id);
                      if (!barbersByService[item.id]?.some((barber) => barber.id === barberId)) {
                        setBarberId("ANY");
                      }
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-label font-semibold">{item.name}</span>
                      <span className="text-accent shrink-0 font-semibold">
                        {formatCurrency(item.priceCents, locale)}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="text-label-secondary mt-1 text-sm">{item.description}</p>
                    ) : null}
                    <span className="text-label-tertiary mt-2 block text-[13px] tabular-nums">
                      {item.durationMinutes} min
                    </span>
                  </SelectableCard>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === 1 ? (
          <section aria-label={labels.chooseBarber}>
            <h2 className="text-label mb-3 text-lg font-semibold">{labels.chooseBarber}</h2>
            <ul className="grid gap-3">
              {eligibleBarbers.map((barber) => (
                <li key={barber.id}>
                  <SelectableCard
                    selected={barber.id === barberId}
                    onSelect={() => setBarberId(barber.id)}
                  >
                    <span className="text-label font-semibold">{barber.displayName}</span>
                  </SelectableCard>
                </li>
              ))}
              <li>
                <SelectableCard selected={barberId === "ANY"} onSelect={() => setBarberId("ANY")}>
                  <span className="text-label font-semibold">{labels.anyBarber}</span>
                  <span className="text-label-secondary mt-0.5 block text-sm">
                    {labels.anyBarberHint}
                  </span>
                </SelectableCard>
              </li>
            </ul>
          </section>
        ) : null}

        {step === 2 && service != null ? (
          <SlotPicker
            locale={locale}
            chunks={props.chunks}
            serviceId={service.id}
            barberId={eligibleBarbers.some((barber) => barber.id === barberId) ? barberId : "ANY"}
            labels={labels.picker}
            selectedDateKey={dateKey}
            selectedStartMs={startMs}
            refreshSignal={refreshSignal}
            onDaySelect={(key) => {
              setDateKey(key);
              setStartMs(null);
              setStartMinute(null);
              setBanner(null);
            }}
            onSlotSelect={(slot: Slot) => {
              setDateKey(slot.dateKey);
              setStartMs(slot.startMs);
              setStartMinute(slot.startMinute);
              setBanner(null);
            }}
          />
        ) : null}

        {step === 3 ? (
          <section aria-label={labels.yourDetails}>
            <h2 className="text-label mb-3 text-lg font-semibold">{labels.yourDetails}</h2>
            <div className="grid gap-4">
              <TextField
                label={labels.name}
                placeholder={labels.namePlaceholder}
                value={form.name}
                autoComplete="name"
                onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                invalid={form.name.trim().length > 0 && form.name.trim().length < 2}
                invalidLabel={labels.invalidField}
              />
              <TextField
                label={labels.phone}
                placeholder={labels.phonePlaceholder}
                value={form.phone}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                invalid={form.phone.trim().length > 0 && !isValidPhone(form.phone)}
                invalidLabel={labels.invalidField}
              />
              <TextField
                label={`${labels.email} (${labels.emailOptional})`}
                placeholder=""
                value={form.email}
                type="email"
                autoComplete="email"
                inputMode="email"
                onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                invalid={form.email.trim().length > 0 && !isValidEmail(form.email)}
                invalidLabel={labels.invalidField}
              />
              <TextField
                label={`${labels.notes} (${labels.notesOptional})`}
                placeholder={labels.notesPlaceholder}
                value={form.notes}
                multiline
                onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
              />
            </div>
          </section>
        ) : null}

        {step === 4 && service != null && dateKey != null && startMs != null ? (
          <ReviewSummary
            labels={{
              review: labels.review,
              serviceLabel: labels.serviceLabel,
              barberLabel: labels.barberLabel,
              whenLabel: labels.whenLabel,
              priceLabel: labels.priceLabel,
              edit: labels.edit,
            }}
            locale={locale}
            serviceName={service.name}
            priceCents={service.priceCents}
            when={
              barberId !== "ANY"
                ? `${formatDateTime(startMs, locale)} · ${
                    eligibleBarbers.find((barber) => barber.id === barberId)?.displayName ?? ""
                  }`
                : formatDateTime(startMs, locale)
            }
            onEdit={() => setStep(2)}
          />
        ) : null}
      </div>

      {step >= 0 && step < 4 ? (
        <nav className="border-separator mt-8 flex items-center justify-between gap-3 border-t pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((current) => (current - 1) as Step)}
              className="border-separator text-label inline-flex h-11 items-center rounded-full border px-5 text-[15px] font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              {labels.back}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((current) => (current + 1) as Step)}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-6 text-[15px] font-medium",
              "transition-transform duration-150 ease-out active:scale-[0.96]",
              "disabled:pointer-events-none disabled:opacity-40",
              "bg-accent text-on-accent",
            )}
          >
            {labels.next}
          </button>
        </nav>
      ) : null}

      {step === 4 ? (
        <div className="mt-8">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
            className={cn(
              "bg-accent text-on-accent inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-base font-medium",
              "transition-transform duration-150 ease-out active:scale-[0.98]",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {submitting ? labels.confirming : labels.confirmAndBook}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Confirmation({
  token,
  service,
  startMs,
  locale,
  labels,
}: {
  token: string;
  service: WizardService;
  startMs: number;
  locale: Locale;
  labels: BookingWizardProps["labels"];
}) {
  const manageHref = `/${locale}/manage/${token}`;
  return (
    <div className="px-4 py-14 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-600 dark:text-emerald-400"
      >
        ✓
      </span>
      <h1 className="text-label text-3xl font-semibold tracking-tight">{labels.confirmed}</h1>
      <p className="text-label-secondary mx-auto mt-2 max-w-sm text-[15px]">
        {labels.confirmedSubtitle}
      </p>
      <p className="text-label mt-6 font-medium">{service.name}</p>
      <p className="text-label-secondary mt-1 text-[15px]">{formatDateTime(startMs, locale)}</p>
      <div className="mx-auto mt-8 grid max-w-xs gap-3">
        <a
          href={`/api/manage/${token}/ics`}
          className="border-separator text-label inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          {labels.addToCalendar}
        </a>
        <Link
          href={manageHref}
          className="bg-accent text-on-accent inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          {labels.manageBooking}
        </Link>
      </div>
    </div>
  );
}

function SelectableCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl p-4 text-left ring-1 transition-all duration-150",
        selected
          ? "bg-accent-soft/50 ring-accent ring-[1.5px]"
          : "ring-separator bg-card hover:bg-inset ring-1",
      )}
    >
      {children}
    </button>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
  invalid,
  invalidLabel,
  type = "text",
  autoComplete,
  inputMode,
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  invalidLabel?: string;
  type?: "text" | "tel" | "email";
  autoComplete?: string;
  inputMode?: "tel" | "email";
  multiline?: boolean;
}) {
  const shared =
    "bg-inset ring-separator focus:ring-accent w-full rounded-xl px-4 py-3 text-[15px] ring-1 outline-none transition-shadow placeholder:text-label-tertiary disabled:opacity-50";
  return (
    <label className="block">
      <span className="text-label mb-1.5 block text-sm font-medium">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          rows={3}
          maxLength={500}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={255}
          onChange={(event) => onChange(event.target.value)}
          className={cn(shared, invalid && "ring-destructive")}
        />
      )}
      {invalid && invalidLabel ? (
        <span role="alert" className="text-destructive mt-1 block text-[13px]">
          {invalidLabel}
        </span>
      ) : null}
    </label>
  );
}

function isValidPhone(value: string): boolean {
  return /^[+()\-\s\d]{6,32}$/.test(value.trim());
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function ReviewSummary({
  labels,
  locale,
  serviceName,
  when,
  priceCents,
  onEdit,
}: {
  labels: {
    review: string;
    serviceLabel: string;
    barberLabel: string;
    whenLabel: string;
    priceLabel: string;
    edit: string;
  };
  locale: Locale;
  serviceName: string;
  when: string;
  priceCents: number;
  onEdit: () => void;
}) {
  return (
    <section aria-label={labels.review}>
      <h2 className="text-label mb-3 text-lg font-semibold">{labels.review}</h2>
      <dl className="bg-card ring-separator divide-separator divide-y rounded-2xl ring-1">
        <Row term={labels.serviceLabel}>{serviceName}</Row>
        <Row term={labels.whenLabel}>{when}</Row>
        <Row term={labels.priceLabel}>
          <span className="text-accent font-semibold">{formatCurrency(priceCents, locale)}</span>
        </Row>
      </dl>
      <button type="button" onClick={onEdit} className="text-accent mt-3 text-sm font-medium">
        {labels.edit}
      </button>
    </section>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-label-secondary text-sm">{term}</dt>
      <dd className="text-label text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
}
