CREATE TABLE product (
    id                 BIGSERIAL PRIMARY KEY,
    brand_id           BIGINT        NOT NULL REFERENCES brand (id),
    category_id        BIGINT        NOT NULL REFERENCES category (id),
    slug               VARCHAR(120)  NOT NULL UNIQUE,
    name_fa            VARCHAR(200)  NOT NULL,
    name_en            VARCHAR(200),
    description_fa     TEXT,
    description_en     TEXT,
    status             VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    featured           BOOLEAN       NOT NULL DEFAULT FALSE,
    seo_title_fa       VARCHAR(70),
    seo_title_en       VARCHAR(70),
    seo_description_fa VARCHAR(160),
    seo_description_en VARCHAR(160),
    rating_avg         NUMERIC(3, 2) NOT NULL DEFAULT 0,
    rating_count       INT           NOT NULL DEFAULT 0,
    version            BIGINT        NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_product_status CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_product_brand ON product (brand_id);
CREATE INDEX idx_product_category ON product (category_id);
CREATE INDEX idx_product_status ON product (status);
CREATE INDEX idx_product_updated ON product (updated_at DESC, id DESC);
