CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    staff_user_id BIGINT      REFERENCES staff_user (id),
    action        VARCHAR(60) NOT NULL,
    entity_type   VARCHAR(40) NOT NULL,
    entity_id     BIGINT,
    before        JSONB,
    after         JSONB,
    ip            VARCHAR(45),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity_type ON audit_log (entity_type, id DESC);
CREATE INDEX idx_audit_log_staff_user ON audit_log (staff_user_id, id DESC);
