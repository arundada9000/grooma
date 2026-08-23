-- Double-booking guard: a barber may hold at most one active
-- (PENDING or CONFIRMED) appointment per time range.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_double_booking"
  EXCLUDE USING gist (
    "barber_id" WITH =,
    tstzrange("start_time", "end_time") WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
