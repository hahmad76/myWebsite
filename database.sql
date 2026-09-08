-- Existing database schema is kept intact.
-- Order request text is added by the migration below rather than changing
-- the CREATE TABLE statement here, so existing production data is preserved.

-- Run this once in phpMyAdmin against the SSHP production database:
-- ALTER TABLE orders ADD COLUMN request_text TEXT NULL AFTER service;
