-- V3: Convert role column from PostgreSQL native enum to VARCHAR.
--
-- Reasons:
-- 1. Hibernate 6 (@Enumerated(EnumType.STRING)) sends role values as varchar;
--    PostgreSQL won't implicitly cast varchar → role_enum, causing insert failures.
-- 2. The original role_enum contained 'SERVICE_SHOP' which does not match the
--    Java Role enum value 'SERVICE_SHOP_REPRESENTATIVE'.
--
-- Converting to VARCHAR avoids both issues and lets the Java enum be the
-- single source of truth for allowed values.

ALTER TABLE users
    ALTER COLUMN role TYPE VARCHAR(50) USING role::VARCHAR;

DROP TYPE role_enum;
