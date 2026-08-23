-- Double-booking guard (AD-03 in docs/IMPLEMENTATION_PLAN.md).
-- btree_gist teaches GiST to handle uuid equality so it can be combined
-- with a range overlap check in a single exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_double_booking"
EXCLUDE USING gist (
  "barber_id" WITH =,
  tstzrange("start_time", "end_time") WITH &&
) WHERE ("status" IN ('PENDING', 'CONFIRMED'));
