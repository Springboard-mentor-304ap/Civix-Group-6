-- V5__petition_status_timeline.sql

-- 1. Update the users check constraint to support ADMIN role
-- In MySQL 8, check constraint name defaults to `users_chk_1`.
ALTER TABLE users DROP CHECK users_chk_1;
ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('CITIZEN', 'OFFICIAL', 'ADMIN'));

-- 2. Create petition_status_history table
CREATE TABLE petition_status_history (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    petition_id     BIGINT        NOT NULL,
    status          VARCHAR(50)   NOT NULL,
    official_id     BIGINT        NULL,
    official_name   VARCHAR(100)  NULL,
    response        TEXT          NULL,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_petition FOREIGN KEY (petition_id) REFERENCES petitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_official FOREIGN KEY (official_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Create index on petition_id for history tracking
CREATE INDEX idx_history_petition ON petition_status_history(petition_id);
