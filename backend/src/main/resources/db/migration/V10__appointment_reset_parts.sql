-- V10__appointment_reset_parts.sql
-- Join table to track which consumable parts were reset during an appointment.

CREATE TABLE appointment_reset_parts (
    appointment_id UUID NOT NULL,
    part_id UUID NOT NULL,
    PRIMARY KEY (appointment_id, part_id),
    CONSTRAINT fk_arp_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT fk_arp_part FOREIGN KEY (part_id) REFERENCES consumable_parts(id) ON DELETE CASCADE
);
