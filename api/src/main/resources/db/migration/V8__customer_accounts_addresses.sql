CREATE TABLE customer (
    id            BIGSERIAL PRIMARY KEY,
    mobile        VARCHAR(11)  NOT NULL UNIQUE,
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    blocked       BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE customer_address (
    id               BIGSERIAL PRIMARY KEY,
    customer_id      BIGINT       NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    province         VARCHAR(100) NOT NULL,
    city             VARCHAR(100) NOT NULL,
    line             TEXT         NOT NULL,
    postal_code      VARCHAR(10)  NOT NULL,
    recipient_name   VARCHAR(100) NOT NULL,
    recipient_mobile VARCHAR(11)  NOT NULL,
    is_default       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_mobile ON customer (mobile);
CREATE INDEX idx_customer_address_customer_id ON customer_address (customer_id);
