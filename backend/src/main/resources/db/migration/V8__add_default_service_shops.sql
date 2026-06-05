-- V8: Add default approved service shops

INSERT INTO service_shops (id, name, address, contact_email, contact_phone, approved) VALUES
('b3c2c770-4f81-456a-93f5-79a831e50f5e', 'AutoFix Central', '123 Main St, City', 'contact@autofix.com', '555-0123', true),
('e9d8f331-1a2b-4c5d-8e7f-6a5b4c3d2e1f', 'Speedy Repairs', '456 West Blvd, City', 'info@speedyrepairs.com', '555-0987', true)
ON CONFLICT DO NOTHING;
