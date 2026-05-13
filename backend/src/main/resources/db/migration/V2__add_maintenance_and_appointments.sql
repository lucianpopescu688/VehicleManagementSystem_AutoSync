-- V2__add_maintenance_and_appointments.sql
-- Add tables for maintenance records and appointments

-- Create maintenance_records table
CREATE TABLE maintenance_records (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    mileage_at_replacement BIGINT,
    date DATE,
    performed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(date);

-- Create appointment_status enum type
CREATE TYPE appointment_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- Create service_shops table
CREATE TABLE service_shops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_shops_approved ON service_shops(approved);

-- Create appointments table
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    requested_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_shop_id BIGINT NOT NULL REFERENCES service_shops(id) ON DELETE CASCADE,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    status appointment_status DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_vehicle ON appointments(vehicle_id);
CREATE INDEX idx_appointments_requested_by ON appointments(requested_by_id);
CREATE INDEX idx_appointments_shop ON appointments(target_shop_id);
CREATE INDEX idx_appointments_status ON appointments(status);

