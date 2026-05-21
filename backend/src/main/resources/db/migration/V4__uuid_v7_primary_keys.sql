-- V4: Convert all BIGINT PKs to UUID, add owner_id to vehicles for RBAC.
-- Uses gen_random_uuid() for existing rows; new rows get UUID v7 from Hibernate.

-- Drop all FK constraints referencing changing PKs
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_assigned_driver_id_fkey;
ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS maintenance_records_vehicle_id_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_vehicle_id_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_requested_by_id_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_target_shop_id_fkey;

-- Add UUID shadow columns
ALTER TABLE users ADD COLUMN _uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE service_shops ADD COLUMN _uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE vehicles ADD COLUMN _uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE vehicles ADD COLUMN _owner_id UUID;
ALTER TABLE vehicles ADD COLUMN _assigned_driver_uuid UUID;
ALTER TABLE maintenance_records ADD COLUMN _uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE maintenance_records ADD COLUMN _vehicle_uuid UUID;
ALTER TABLE appointments ADD COLUMN _uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE appointments ADD COLUMN _vehicle_uuid UUID;
ALTER TABLE appointments ADD COLUMN _requested_by_uuid UUID;
ALTER TABLE appointments ADD COLUMN _target_shop_uuid UUID;

-- Populate UUID FK shadows from old BIGINT joins
UPDATE vehicles v SET _assigned_driver_uuid = u._uuid FROM users u WHERE v.assigned_driver_id = u.id;
UPDATE vehicles v SET _owner_id = u._uuid FROM users u WHERE v.assigned_driver_id = u.id;
UPDATE maintenance_records mr SET _vehicle_uuid = v._uuid FROM vehicles v WHERE mr.vehicle_id = v.id;
UPDATE appointments a SET _vehicle_uuid = v._uuid FROM vehicles v WHERE a.vehicle_id = v.id;
UPDATE appointments a SET _requested_by_uuid = u._uuid FROM users u WHERE a.requested_by_id = u.id;
UPDATE appointments a SET _target_shop_uuid = s._uuid FROM service_shops s WHERE a.target_shop_id = s.id;

-- Drop old PKs
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE service_shops DROP CONSTRAINT service_shops_pkey;
ALTER TABLE vehicles DROP CONSTRAINT vehicles_pkey;
ALTER TABLE maintenance_records DROP CONSTRAINT maintenance_records_pkey;
ALTER TABLE appointments DROP CONSTRAINT appointments_pkey;

-- Drop old BIGINT columns (sequences owned by them are dropped automatically)
ALTER TABLE users DROP COLUMN id;
ALTER TABLE service_shops DROP COLUMN id;
ALTER TABLE vehicles DROP COLUMN id;
ALTER TABLE vehicles DROP COLUMN assigned_driver_id;
ALTER TABLE maintenance_records DROP COLUMN id;
ALTER TABLE maintenance_records DROP COLUMN vehicle_id;
ALTER TABLE appointments DROP COLUMN id;
ALTER TABLE appointments DROP COLUMN vehicle_id;
ALTER TABLE appointments DROP COLUMN requested_by_id;
ALTER TABLE appointments DROP COLUMN target_shop_id;

-- Rename shadow columns to final names
ALTER TABLE users RENAME COLUMN _uuid TO id;
ALTER TABLE service_shops RENAME COLUMN _uuid TO id;
ALTER TABLE vehicles RENAME COLUMN _uuid TO id;
ALTER TABLE vehicles RENAME COLUMN _assigned_driver_uuid TO assigned_driver_id;
ALTER TABLE vehicles RENAME COLUMN _owner_id TO owner_id;
ALTER TABLE maintenance_records RENAME COLUMN _uuid TO id;
ALTER TABLE maintenance_records RENAME COLUMN _vehicle_uuid TO vehicle_id;
ALTER TABLE appointments RENAME COLUMN _uuid TO id;
ALTER TABLE appointments RENAME COLUMN _vehicle_uuid TO vehicle_id;
ALTER TABLE appointments RENAME COLUMN _requested_by_uuid TO requested_by_id;
ALTER TABLE appointments RENAME COLUMN _target_shop_uuid TO target_shop_id;

-- Re-add PKs
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE service_shops ADD CONSTRAINT service_shops_pkey PRIMARY KEY (id);
ALTER TABLE vehicles ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);
ALTER TABLE maintenance_records ADD CONSTRAINT maintenance_records_pkey PRIMARY KEY (id);
ALTER TABLE appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);

-- Restore FK constraints
ALTER TABLE vehicles
    ADD CONSTRAINT fk_vehicles_assigned_driver
    FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE vehicles
    ADD CONSTRAINT fk_vehicles_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE maintenance_records
    ALTER COLUMN vehicle_id SET NOT NULL,
    ADD CONSTRAINT fk_maintenance_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

ALTER TABLE appointments
    ALTER COLUMN vehicle_id SET NOT NULL,
    ALTER COLUMN requested_by_id SET NOT NULL,
    ALTER COLUMN target_shop_id SET NOT NULL,
    ADD CONSTRAINT fk_appointments_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_appointments_requested_by
    FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_appointments_target_shop
    FOREIGN KEY (target_shop_id) REFERENCES service_shops(id) ON DELETE CASCADE;

-- Recreate indexes
DROP INDEX IF EXISTS idx_vehicles_assigned_driver;
DROP INDEX IF EXISTS idx_maintenance_vehicle;
DROP INDEX IF EXISTS idx_maintenance_date;
DROP INDEX IF EXISTS idx_appointments_vehicle;
DROP INDEX IF EXISTS idx_appointments_requested_by;
DROP INDEX IF EXISTS idx_appointments_shop;
DROP INDEX IF EXISTS idx_appointments_status;

CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(date);
CREATE INDEX idx_appointments_vehicle ON appointments(vehicle_id);
CREATE INDEX idx_appointments_requested_by ON appointments(requested_by_id);
CREATE INDEX idx_appointments_shop ON appointments(target_shop_id);
CREATE INDEX idx_appointments_status ON appointments(status);
