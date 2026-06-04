-- V5: Iteration 2 — mileage tracking, consumable parts, legal documents, maintenance alerts

CREATE TABLE mileage_logs (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    recorded_mileage INTEGER NOT NULL,
    recorded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mileage_logs_vehicle ON mileage_logs(vehicle_id);
CREATE INDEX idx_mileage_logs_created_at ON mileage_logs(created_at DESC);

CREATE TABLE consumable_parts (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    lifespan_km INTEGER NOT NULL,
    last_replaced_mileage INTEGER NOT NULL,
    maintenance_required BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consumable_parts_vehicle ON consumable_parts(vehicle_id);
CREATE INDEX idx_consumable_parts_maintenance ON consumable_parts(maintenance_required);

CREATE TABLE legal_documents (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(255),
    expiry_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_legal_documents_vehicle ON legal_documents(vehicle_id);
CREATE INDEX idx_legal_documents_expiry ON legal_documents(expiry_date);

CREATE TABLE maintenance_alerts (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_alerts_vehicle ON maintenance_alerts(vehicle_id);
CREATE INDEX idx_maintenance_alerts_resolved ON maintenance_alerts(resolved);
