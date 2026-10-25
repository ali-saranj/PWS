CREATE TABLE variant (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT       NOT NULL REFERENCES product (id),
    sku                 VARCHAR(64)  NOT NULL UNIQUE,
    flavour_fa          VARCHAR(100),
    flavour_en          VARCHAR(100),
    size_label          VARCHAR(50),
    weight_grams        INT,
    base_price          BIGINT       NOT NULL,
    compare_at_price    BIGINT,
    stock_on_hand       INT          NOT NULL DEFAULT 0,
    low_stock_threshold INT          NOT NULL DEFAULT 5,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order          INT          NOT NULL DEFAULT 0,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_variant_stock CHECK (stock_on_hand >= 0),
    CONSTRAINT chk_variant_base_price CHECK (base_price > 0)
);

CREATE INDEX idx_variant_product ON variant (product_id);

CREATE TABLE volume_tier (
    id         BIGSERIAL PRIMARY KEY,
    variant_id BIGINT      NOT NULL REFERENCES variant (id),
    min_qty    INT         NOT NULL,
    unit_price BIGINT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_volume_tier UNIQUE (variant_id, min_qty),
    CONSTRAINT chk_tier_min_qty CHECK (min_qty >= 2),
    CONSTRAINT chk_tier_price CHECK (unit_price > 0)
);

CREATE TABLE stock_movement (
    id            BIGSERIAL PRIMARY KEY,
    variant_id    BIGINT       NOT NULL REFERENCES variant (id),
    delta         INT          NOT NULL,
    reason        VARCHAR(30)  NOT NULL,
    ref_id        BIGINT,
    staff_user_id BIGINT REFERENCES staff_user (id),
    note          VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_movement_reason CHECK (reason IN ('INITIAL', 'MANUAL_ADJUSTMENT', 'ORDER_PAID', 'ORDER_CANCELLED'))
);

CREATE INDEX idx_stock_movement_variant ON stock_movement (variant_id, id);
