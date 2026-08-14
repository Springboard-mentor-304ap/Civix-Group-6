-- V4__official_petition_management.sql
-- Add official petition management fields and foreign keys to petitions table

ALTER TABLE petitions
    ADD COLUMN assigned_department VARCHAR(100) NULL,
    ADD COLUMN assigned_official_id BIGINT NULL,
    ADD COLUMN priority VARCHAR(20) NULL DEFAULT 'MEDIUM',
    ADD COLUMN internal_notes TEXT NULL,
    ADD COLUMN reviewed_at DATETIME NULL,
    ADD COLUMN reviewed_by_id BIGINT NULL;

ALTER TABLE petitions
    ADD CONSTRAINT fk_petitions_assigned_official
    FOREIGN KEY (assigned_official_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE petitions
    ADD CONSTRAINT fk_petitions_reviewed_by
    FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL;
