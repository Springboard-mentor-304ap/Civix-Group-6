-- V1__init_schema.sql
-- Civix initial schema (MySQL syntax).
-- VARCHAR + Java-side enums used instead of native ENUM columns for role/status,
-- so adding a new value later (e.g. a new role) is a one-line Java change,
-- no ALTER TABLE needed.

CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password        VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL CHECK (role IN ('CITIZEN', 'OFFICIAL')),
    location        VARCHAR(100),
    verified        BOOLEAN       NOT NULL DEFAULT FALSE,   -- needed for "Unverified Official" badge
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE petitions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    creator_id      BIGINT        NOT NULL,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    location        VARCHAR(100),
    signature_goal  INT           NOT NULL DEFAULT 100,
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'UNDER_REVIEW', 'CLOSED')),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_petitions_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE signatures (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    petition_id     BIGINT        NOT NULL,
    user_id         BIGINT        NOT NULL,
    timestamp       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_signatures_petition FOREIGN KEY (petition_id) REFERENCES petitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_signatures_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_petition_user (petition_id, user_id)   -- a user can only sign a petition once
) ENGINE=InnoDB;

CREATE TABLE polls (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    options         JSON          NOT NULL,   -- e.g. ["Yes", "No", "Maybe"]
    created_by      BIGINT        NOT NULL,
    target_location VARCHAR(100),
    closes_on       TIMESTAMP     NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_polls_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE votes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    poll_id         BIGINT        NOT NULL,
    user_id         BIGINT        NOT NULL,
    selected_option VARCHAR(100)  NOT NULL,
    timestamp       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_votes_poll FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_poll_user (poll_id, user_id)   -- a user can only vote once per poll
) ENGINE=InnoDB;

CREATE TABLE admin_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    action          TEXT          NOT NULL,
    user_id         BIGINT        NULL,
    timestamp       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_adminlogs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Helpful indexes for filtering (Milestone 2 filter view: location + category + status)
CREATE INDEX idx_petitions_location ON petitions(location);
CREATE INDEX idx_petitions_category ON petitions(category);
CREATE INDEX idx_petitions_status   ON petitions(status);
CREATE INDEX idx_polls_target_location ON polls(target_location);
CREATE INDEX idx_users_email ON users(email);
