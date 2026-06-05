-- V9__appointment_completion.sql
-- Capture service-completion data on appointments.

ALTER TABLE appointments
    ADD COLUMN recorded_mileage INTEGER,
    ADD COLUMN total_cost       NUMERIC(12, 2),
    ADD COLUMN mechanic_notes   TEXT,
    ADD COLUMN completed_at     TIMESTAMP,
    ADD COLUMN completed_by_id  UUID REFERENCES users(id) ON DELETE SET NULL;
