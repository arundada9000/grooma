"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/session";
import { getLocale } from "@/i18n/server";
import { markAllNotificationsRead, markNotificationRead } from "@/db/repositories/notifications";

/**
 * Inbox mutations are plain form actions so the center works without
 * client JS. Opening an entry marks it read first, then deep links to
 * the appointment detail page (spec 68).
 */
export async function openNotificationAction(formData: FormData): Promise<void> {
  const session = await requireOwner();
  const locale = await getLocale();

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

export async function markAllReadAction(): Promise<void> {
  const session = await requireOwner();
  await markAllNotificationsRead(session.user.id);
  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/notifications`);
}
