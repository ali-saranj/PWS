CREATE TABLE otp_code (
    id          BIGSERIAL PRIMARY KEY,
    mobile      VARCHAR(11)  NOT NULL,
    purpose     VARCHAR(20)  NOT NULL,
    code_hash   VARCHAR(64)  NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_code_mobile_purpose_created ON otp_code (mobile, purpose, created_at DESC);
