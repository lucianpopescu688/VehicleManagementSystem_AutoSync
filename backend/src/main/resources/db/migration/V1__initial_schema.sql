-- V1__initial_schema.sql
-- Initial schema creation for Vehicle Management System

-- Create Role enum type
CREATE TYPE role_enum AS ENUM ('STANDARD_USER', 'FLEET_MANAGER', 'FLEET_DRIVER', 'SERVICE_SHOP', 'ADMIN');

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for quick lookups
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Create vehicles table
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    vin VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    current_mileage INTEGER NOT NULL,
    assigned_driver_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on assigned_driver_id for quick lookups
CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);
CREATE UNIQUE INDEX idx_vehicles_vin ON vehicles(vin);
