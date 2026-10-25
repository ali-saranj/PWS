CREATE TABLE staff_user (
    id                        BIGSERIAL PRIMARY KEY,
    username                  VARCHAR(50)  NOT NULL UNIQUE,
    password_hash             VARCHAR(100) NOT NULL,
    mobile                    VARCHAR(11)  NOT NULL UNIQUE,
    full_name                 VARCHAR(100) NOT NULL,
    role                      VARCHAR(20)  NOT NULL,
    active                    BOOLEAN      NOT NULL DEFAULT TRUE,
    failed_login_count        INT          NOT NULL DEFAULT 0,
    failed_login_window_start TIMESTAMPTZ,
    locked_until              TIMESTAMPTZ,
    version                   BIGINT       NOT NULL DEFAULT 0,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE refresh_token (
    id           BIGSERIAL PRIMARY KEY,
    subject_type VARCHAR(10) NOT NULL,
    subject_id   BIGINT      NOT NULL,
    token_hash   VARCHAR(64) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_token_subject ON refresh_token (subject_type, subject_id);
