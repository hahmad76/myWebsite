-- SSHP Career Portal v2 migration
-- Run this once against the existing SSHP Career database after career-schema.sql.
-- Safe for existing records: new columns use defaults/NULLs.

ALTER TABLE career_users
  ADD COLUMN qualification VARCHAR(255) NULL AFTER phone,
  ADD COLUMN address VARCHAR(255) NULL AFTER qualification,
  ADD COLUMN experience VARCHAR(255) NULL AFTER address,
  ADD COLUMN salary_min DECIMAL(12,2) NULL AFTER experience,
  ADD COLUMN salary_max DECIMAL(12,2) NULL AFTER salary_min,
  ADD COLUMN description TEXT NULL AFTER salary_max,
  ADD INDEX idx_cu_qualification (qualification),
  ADD INDEX idx_cu_address (address);

ALTER TABLE vacancies
  ADD COLUMN salary_min DECIMAL(12,2) NULL AFTER employment_type,
  ADD COLUMN salary_max DECIMAL(12,2) NULL AFTER salary_min,
  ADD COLUMN openings INT NOT NULL DEFAULT 1 AFTER salary_max,
  ADD INDEX idx_v_location (location),
  ADD INDEX idx_v_salary (salary_min, salary_max);
