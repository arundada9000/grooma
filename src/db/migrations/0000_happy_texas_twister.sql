CREATE TYPE "public"."appointment_source" AS ENUM('ONLINE', 'ADMIN', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."break_kind" AS ENUM('RECURRING', 'ONE_OFF');--> statement-breakpoint
CREATE TYPE "public"."notification_audience" AS ENUM('CUSTOMER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('OWNER', 'BARBER');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"barber_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDING' NOT NULL,
	"source" "appointment_source" DEFAULT 'ONLINE' NOT NULL,
	"service_name_snapshot" jsonb NOT NULL,
	"barber_name_snapshot" varchar(120) NOT NULL,
	"price_at_booking_cents" integer NOT NULL,
	"duration_at_booking_minutes" integer NOT NULL,
	"customer_notes" text,
	"admin_notes" text,
	"cancel_reason" text,
	"lookup_token_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barber_services" (
	"barber_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	CONSTRAINT "barber_services_barber_id_service_id_pk" PRIMARY KEY("barber_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "barbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" text,
	"name" varchar(160) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"bio" jsonb,
	"photo_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"barber_id" uuid,
	"kind" "break_kind" NOT NULL,
	"weekday" smallint,
	"one_off_date" date,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"barber_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"full_day" boolean DEFAULT true NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"email" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"template" varchar(64) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'QUEUED' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"audience" "notification_audience" NOT NULL,
	"user_id" text,
	"appointment_id" uuid,
	"type" varchar(64) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"duration_minutes" integer NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"price_cents" integer NOT NULL,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"short_name" varchar(60),
	"tagline" varchar(200),
	"description" text,
	"contact" jsonb NOT NULL,
	"location" jsonb NOT NULL,
	"social" jsonb NOT NULL,
	"branding" jsonb NOT NULL,
	"homepage" jsonb NOT NULL,
	"booking_rules" jsonb NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Kathmandu' NOT NULL,
	"currency" varchar(8) DEFAULT 'NPR' NOT NULL,
	"locale" varchar(8) DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'BARBER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "working_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"barber_id" uuid,
	"weekday" smallint NOT NULL,
	"intervals" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closures" ADD CONSTRAINT "closures_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closures" ADD CONSTRAINT "closures_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_issuer_account_id_key" ON "accounts" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_shop_start_idx" ON "appointments" USING btree ("shop_id","start_time");--> statement-breakpoint
CREATE INDEX "appointments_barber_start_idx" ON "appointments" USING btree ("barber_id","start_time");--> statement-breakpoint
CREATE INDEX "appointments_customer_idx" ON "appointments" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_lookup_token_key" ON "appointments" USING btree ("lookup_token_hash");--> statement-breakpoint
CREATE INDEX "barber_services_service_idx" ON "barber_services" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "barbers_shop_idx" ON "barbers" USING btree ("shop_id","display_order");--> statement-breakpoint
CREATE INDEX "breaks_scope_idx" ON "breaks" USING btree ("shop_id","barber_id");--> statement-breakpoint
CREATE INDEX "closures_range_idx" ON "closures" USING btree ("shop_id","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_shop_phone_key" ON "customers" USING btree ("shop_id","phone");--> statement-breakpoint
CREATE INDEX "email_log_shop_idx" ON "email_log" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_inbox_idx" ON "notifications" USING btree ("shop_id","audience","read_at");--> statement-breakpoint
CREATE INDEX "services_shop_idx" ON "services" USING btree ("shop_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shops_slug_key" ON "shops" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_shop_idx" ON "users" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "working_hours_scope_idx" ON "working_hours" USING btree ("shop_id","barber_id","weekday");