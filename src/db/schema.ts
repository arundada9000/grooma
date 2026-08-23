import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/i18n/localized-text";
import type { WorkingInterval } from "@/lib/validation/schedule";
import type {
  BookingRules,
  BrandingConfig,
  ContactInfo,
  HomepageConfig,
  LocationInfo,
  SocialLinks,
} from "@/lib/validation/shop-config";

/**
 * Conventions
 * - Money is stored as integer minor units (paisa for NPR).
 * - Instants are timestamptz in UTC. Wall-clock schedule strings are
 *   interpreted in the owning shop timezone at read time.
 * - Every tenant owned table carries shop_id. Access goes through
 *   repositories that always scope by it.
 */

export const userRoleEnum = pgEnum("user_role", ["OWNER", "BARBER"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const appointmentSourceEnum = pgEnum("appointment_source", ["ONLINE", "ADMIN", "WALK_IN"]);

export const breakKindEnum = pgEnum("break_kind", ["RECURRING", "ONE_OFF"]);

export const notificationAudienceEnum = pgEnum("notification_audience", ["CUSTOMER", "ADMIN"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    shortName: varchar("short_name", { length: 60 }),
    tagline: varchar("tagline", { length: 200 }),
    description: text("description"),
    contact: jsonb("contact").$type<ContactInfo>().notNull(),
    location: jsonb("location").$type<LocationInfo>().notNull(),
    social: jsonb("social").$type<SocialLinks>().notNull(),
    branding: jsonb("branding").$type<BrandingConfig>().notNull(),
    homepage: jsonb("homepage").$type<HomepageConfig>().notNull(),
    bookingRules: jsonb("booking_rules").$type<BookingRules>().notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kathmandu"),
    currency: varchar("currency", { length: 8 }).notNull().default("NPR"),
    locale: varchar("locale", { length: 8 }).notNull().default("en"),
    ...timestamps,
  },
  (table) => [uniqueIndex("shops_slug_key").on(table.slug)],
);

/**
 * Better Auth identity tables follow its expected model names
 * (users, accounts, sessions, verifications via usePlural) and text ids.
 * Domain fields shopId and role ride along as additionalFields.
 */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("BARBER"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    index("users_shop_idx").on(table.shopId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_token_key").on(table.token),
    index("sessions_user_idx").on(table.userId),
  ],
);

/** Credential and OAuth providers store their secrets here, never on users. */
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Provider namespace, e.g. "credential" for email and password. */
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("accounts_issuer_account_id_key").on(table.issuer, table.accountId),
    index("accounts_user_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    priceCents: integer("price_cents").notNull(),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("services_shop_idx").on(table.shopId, table.displayOrder)],
);

export const barbers = pgTable(
  "barbers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 160 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    bio: jsonb("bio").$type<LocalizedText>(),
    photoUrl: text("photo_url"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("barbers_shop_idx").on(table.shopId, table.displayOrder)],
);

export const barberServices = pgTable(
  "barber_services",
  {
    barberId: uuid("barber_id")
      .notNull()
      .references(() => barbers.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.barberId, table.serviceId] }),
    index("barber_services_service_idx").on(table.serviceId),
  ],
);

/**
 * Working hours exist at shop level (barber_id null) or barber level.
 * Multiple intervals per weekday live inside the intervals array.
 */
export const workingHours = pgTable(
  "working_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    barberId: uuid("barber_id").references(() => barbers.id, { onDelete: "cascade" }),
    /** 0 Sunday through 6 Saturday, matches Date.getUTCDay(). */
    weekday: smallint("weekday").notNull(),
    intervals: jsonb("intervals").$type<WorkingInterval[]>().notNull(),
    ...timestamps,
  },
  (table) => [index("working_hours_scope_idx").on(table.shopId, table.barberId, table.weekday)],
);

/** Recurring weekly breaks or one-off blocked periods, shop or barber scope. */
export const breaks = pgTable(
  "breaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    barberId: uuid("barber_id").references(() => barbers.id, { onDelete: "cascade" }),
    kind: breakKindEnum("kind").notNull(),
    weekday: smallint("weekday"),
    oneOffDate: date("one_off_date"),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    reason: text("reason"),
    ...timestamps,
  },
  (table) => [index("breaks_scope_idx").on(table.shopId, table.barberId)],
);

export const closures = pgTable(
  "closures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    barberId: uuid("barber_id").references(() => barbers.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    fullDay: boolean("full_day").notNull().default(true),
    startTime: varchar("start_time", { length: 5 }),
    endTime: varchar("end_time", { length: 5 }),
    reason: text("reason"),
    ...timestamps,
  },
  (table) => [index("closures_range_idx").on(table.shopId, table.startDate)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 255 }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [uniqueIndex("customers_shop_phone_key").on(table.shopId, table.phone)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    barberId: uuid("barber_id")
      .notNull()
      .references(() => barbers.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("PENDING"),
    source: appointmentSourceEnum("source").notNull().default("ONLINE"),
    // Historical snapshots taken at booking time.
    serviceNameSnapshot: jsonb("service_name_snapshot").$type<LocalizedText>().notNull(),
    barberNameSnapshot: varchar("barber_name_snapshot", { length: 120 }).notNull(),
    priceAtBookingCents: integer("price_at_booking_cents").notNull(),
    durationAtBookingMinutes: integer("duration_at_booking_minutes").notNull(),
    customerNotes: text("customer_notes"),
    adminNotes: text("admin_notes"),
    cancelReason: text("cancel_reason"),
    lookupTokenHash: varchar("lookup_token_hash", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("appointments_shop_start_idx").on(table.shopId, table.startTime),
    index("appointments_barber_start_idx").on(table.barberId, table.startTime),
    index("appointments_customer_idx").on(table.customerId),
    uniqueIndex("appointments_lookup_token_key").on(table.lookupTokenHash),
    /**
     * Hard double-booking guard lives in migration
     * src/db/migrations custom file: a GiST exclusion constraint that
     * rejects overlapping PENDING/CONFIRMED ranges per barber.
     * See AD-03 in docs/IMPLEMENTATION_PLAN.md.
     */
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    audience: notificationAudienceEnum("audience").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_inbox_idx").on(table.shopId, table.audience, table.readAt)],
);

export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    template: varchar("template", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: varchar("status", { length: 16 }).notNull().default("QUEUED"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("email_log_shop_idx").on(table.shopId, table.createdAt)],
);

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Barber = typeof barbers.$inferSelect;
export type NewBarber = typeof barbers.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
