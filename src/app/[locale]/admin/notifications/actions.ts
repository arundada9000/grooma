"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/session";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { markAllNotificationsRead, markNotificationRead } from "@/db/repositories/notifications";

/**
 * Inbox mutations are plain form actions so the center works without
 * client JS. next/root-params cannot be read inside actions, so the
 * page passes its locale through a hidden field. Opening an entry
 * marks it read first, then deep links to the appointment detail
 * page (spec 68).
 */
function formLocale(formData: FormData): Locale {
  const value = formData.get("locale");
  return typeof value === "string" && isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function openNotificationAction(formData: FormData): Promise<void> {
  const session = await requireOwner();
  const locale = formLocale(formData);

  const id = formData.get("id");
  if (typeof id === "string" && id !== "") {
    await markNotificationRead(session.user.id, id);
  }
  revalidatePath(`/${locale}/admin/notifications`);

  const appointmentId = formData.get("appointmentId");
  redirect(
    typeof appointmentId === "string" && appointmentId !== ""
      ? `/${locale}/admin/appointments/${appointmentId}`
      : `/${locale}/admin/notifications`,
  );
}

export async function markAllReadAction(formData: FormData): Promise<void> {
  const session = await requireOwner();
  await markAllNotificationsRead(session.user.id);
  revalidatePath(`/${formLocale(formData)}/admin/notifications`);
}
