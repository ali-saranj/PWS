CREATE TABLE product_image (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT       NOT NULL REFERENCES product (id),
    path       VARCHAR(255) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    alt_fa     VARCHAR(200),
    alt_en     VARCHAR(200),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_image_product ON product_image (product_id, sort_order, id);
