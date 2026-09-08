-- SSHP production database schema
-- This file must remain the full production schema; the live database is migrated separately.

-- NOTE: Production migration for the order request text is:
-- ALTER TABLE orders ADD COLUMN request_text TEXT NULL AFTER service;
