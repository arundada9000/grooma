import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailLog, notifications, users } from "@/db/schema";

/**
 * Read and write models for the in-app admin inbox and the email log.
 * In-app notifications are per user so read state never collides between
 * staff members watching the same shop.
 */

export type NotificationType =
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED";

export interface NotificationRow {
  id: string;
  appointmentId: string | null;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

/** Owner accounts of a shop receive the in-app lifecycle inbox. */
export async function listOwnerIdsByShop(shopId: string): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.shopId, shopId), eq(users.role, "OWNER")));
  return rows.map((row) => row.id);
}

export async function createAdminNotifications(
  shopId: string,
  userIds: string[],
  input: {
    type: NotificationType;
    appointmentId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  if (userIds.length === 0) return;
  await db.insert(notifications).values(
    userIds.map((userId) => ({
      shopId,
      audience: "ADMIN" as const,
      userId,
      appointmentId: input.appointmentId,
      type: input.type,
      payload: input.payload,
    })),
  );
}

export async function listNotificationsForUser(
  userId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  return db
    .select({
      id: notifications.id,
      appointmentId: notifications.appointmentId,
      type: notifications.type,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.count ?? 0;
}

export async function markNotificationRead(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.id, id), isNull(notifications.readAt)),
    )
    .returning({ id: notifications.id });
  return rows.length > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

/**
 * Email delivery audit trail. The row is created QUEUED before the
 * provider call and finalized afterwards so crashes leave evidence.
 */
export async function queueEmail(input: {
  shopId: string;
  toEmail: string;
  template: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  const [row] = await db
    .insert(emailLog)
    .values({
      shopId: input.shopId,
      toEmail: input.toEmail,
      template: input.template,
      payload: input.payload,
      status: "QUEUED",
    })
    .returning({ id: emailLog.id });
  return row.id;
}

export async function finalizeEmail(
  id: string,
  status: "SENT" | "FAILED",
  error?: string,
): Promise<void> {
  await db
    .update(emailLog)
    .set({ status, error: error ?? null })
    .where(eq(emailLog.id, id));
}
