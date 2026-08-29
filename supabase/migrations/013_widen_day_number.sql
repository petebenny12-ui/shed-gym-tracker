-- ============================================================
-- Widen routines.day_number to 1–7  (applied 29 Aug 2026)
-- ============================================================
-- 008_wizard_support.sql intended this, but only parts of 008 ever reached the
-- live database: labels A–J and the nullable exercise2_id were there, the
-- day_number widening was not. Kept as its own file so the repo and the
-- database agree from here on.
ALTER TABLE routines DROP CONSTRAINT routines_day_number_check;
ALTER TABLE routines ADD CONSTRAINT routines_day_number_check CHECK (day_number BETWEEN 1 AND 7);
