CREATE TABLE shipping_method (
    id             BIGSERIAL PRIMARY KEY,
    name_fa        VARCHAR(100) NOT NULL,
    name_en        VARCHAR(100) NOT NULL,
    description_fa VARCHAR(255),
    description_en VARCHAR(255),
    cost           BIGINT       NOT NULL DEFAULT 0,
    free_over      BIGINT,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order     INT          NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO shipping_method (name_fa, name_en, description_fa, description_en, cost, free_over, active, sort_order)
VALUES ('ارسال اکسپرس با پیک شهری', 'Express Courier', 'تحویل سریع با پیک شهری', 'Fast city courier delivery', 450000, 5000000, TRUE, 0);

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(32)  NOT NULL UNIQUE,
    tracking_code       VARCHAR(16)  NOT NULL UNIQUE,
    customer_id         BIGINT       NOT NULL REFERENCES customer(id),
    province            VARCHAR(100) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    address_line        TEXT         NOT NULL,
    postal_code         VARCHAR(10)  NOT NULL,
    recipient_name      VARCHAR(100) NOT NULL,
    recipient_mobile    VARCHAR(11)  NOT NULL,
    shipping_method_id  BIGINT       REFERENCES shipping_method(id),
    shipping_name       VARCHAR(100) NOT NULL,
    shipping_cost       BIGINT       NOT NULL DEFAULT 0,
    subtotal            BIGINT       NOT NULL,
    discount_total      BIGINT       NOT NULL DEFAULT 0,
    total               BIGINT       NOT NULL,
    status              VARCHAR(30)  NOT NULL,
    courier_notes       TEXT,
    admin_notes         TEXT,
    needs_attention     BOOLEAN      NOT NULL DEFAULT FALSE,
    placed_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_orders_status CHECK (status IN ('PENDING_PAYMENT', 'AWAITING_APPROVAL', 'APPROVED', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'))
);

CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_tracking_code ON orders (tracking_code);
CREATE INDEX idx_orders_placed_at ON orders (placed_at DESC);

CREATE TABLE order_item (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id       BIGINT       NOT NULL REFERENCES variant(id),
    product_name_fa  VARCHAR(200) NOT NULL,
    product_name_en  VARCHAR(200),
    variant_label_fa VARCHAR(100) NOT NULL,
    variant_label_en VARCHAR(100),
    sku              VARCHAR(64)  NOT NULL,
    unit_price       BIGINT       NOT NULL,
    qty              INT          NOT NULL CHECK (qty > 0),
    line_total       BIGINT       NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_item_order_id ON order_item (order_id);
CREATE INDEX idx_order_item_variant_id ON order_item (variant_id);

CREATE TABLE order_status_history (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    actor_type  VARCHAR(20) NOT NULL,
    actor_id    BIGINT,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_order_status_history_actor CHECK (actor_type IN ('CUSTOMER', 'STAFF', 'SYSTEM'))
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history (order_id);

CREATE TABLE payment (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT      NOT NULL REFERENCES orders(id),
    gateway          VARCHAR(20) NOT NULL,
    amount           BIGINT      NOT NULL,
    authority        VARCHAR(64) NOT NULL UNIQUE,
    status           VARCHAR(20) NOT NULL,
    ref_id           VARCHAR(64),
    card_pan_masked  VARCHAR(32),
    raw_request      TEXT,
    raw_response     TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_payment_gateway CHECK (gateway IN ('ZARINPAL')),
    CONSTRAINT chk_payment_status CHECK (status IN ('INITIATED', 'PAID', 'FAILED', 'EXPIRED'))
);

CREATE INDEX idx_payment_order_id ON payment (order_id);
CREATE INDEX idx_payment_authority ON payment (authority);

CREATE TABLE stock_reservation (
    id          BIGSERIAL PRIMARY KEY,
    variant_id  BIGINT      NOT NULL REFERENCES variant(id),
    customer_id BIGINT      REFERENCES customer(id),
    qty         INT         NOT NULL CHECK (qty > 0),
    status      VARCHAR(20) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    order_id    BIGINT      REFERENCES orders(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_reservation_status CHECK (status IN ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED'))
);

CREATE INDEX idx_stock_reservation_variant_status_expires ON stock_reservation (variant_id, status, expires_at);
CREATE INDEX idx_stock_reservation_order_id ON stock_reservation (order_id);
