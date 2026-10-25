CREATE TABLE category (
    id         BIGSERIAL PRIMARY KEY,
    name_fa    VARCHAR(200) NOT NULL,
    name_en    VARCHAR(200),
    slug       VARCHAR(120) NOT NULL UNIQUE,
    parent_id  BIGINT       REFERENCES category (id),
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_category_parent ON category (parent_id);

CREATE TABLE brand (
    id         BIGSERIAL PRIMARY KEY,
    name_fa    VARCHAR(200) NOT NULL,
    name_en    VARCHAR(200),
    slug       VARCHAR(120) NOT NULL UNIQUE,
    logo_path  VARCHAR(255),
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
