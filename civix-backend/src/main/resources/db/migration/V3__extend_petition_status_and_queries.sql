-- V3__extend_petition_status_and_queries.sql

-- Drop check constraint on petitions status to allow APPROVED, REJECTED, RESOLVED statuses.
ALTER TABLE petitions DROP CHECK petitions_chk_1;

-- Add official response column to petitions table.
ALTER TABLE petitions ADD COLUMN official_response TEXT NULL;

-- Add status column to polls table.
ALTER TABLE polls ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Create queries table for citizen-official messaging.
CREATE TABLE queries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      BIGINT        NOT NULL,
    official_id     BIGINT        NOT NULL,
    message         TEXT          NOT NULL,
    reply           TEXT          NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED')),
    priority        VARCHAR(20)   NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT')),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_queries_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_queries_official FOREIGN KEY (official_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
