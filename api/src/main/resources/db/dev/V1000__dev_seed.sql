-- Dev-only seed data (profile "dev"). Prices are Rials. No images, no staff (owner comes from bootstrap properties).

INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order) VALUES
    ('پروتئین وی', 'Whey Protein', 'whey-protein', NULL, 1);
INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order)
SELECT 'ایزوله', 'Isolate', 'whey-isolate', id, 1 FROM category WHERE slug = 'whey-protein';
INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order)
SELECT 'کنسانتره', 'Concentrate', 'whey-concentrate', id, 2 FROM category WHERE slug = 'whey-protein';
INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order) VALUES
    ('گینر', 'Gainer', 'gainer', NULL, 2),
    ('آمینو', 'Amino Acids', 'amino', NULL, 3);

INSERT INTO brand (name_fa, name_en, slug) VALUES
    ('اپتیموم نوتریشن', 'Optimum Nutrition', 'optimum-nutrition'),
    ('داتی', 'Dymatize', 'dymatize'),
    ('ماسل‌تک', 'MuscleTech', 'muscletech');

INSERT INTO product (brand_id, category_id, slug, name_fa, name_en, description_fa, description_en, status, featured)
VALUES
    ((SELECT id FROM brand WHERE slug = 'optimum-nutrition'), (SELECT id FROM category WHERE slug = 'whey-isolate'),
     'gold-standard-isolate', 'ایزوله گلد استاندارد', 'Gold Standard Isolate',
     '<p>پروتئین وی ایزوله با جذب سریع.</p>', '<p>Fast-absorbing whey isolate.</p>', 'ACTIVE', TRUE),
    ((SELECT id FROM brand WHERE slug = 'dymatize'), (SELECT id FROM category WHERE slug = 'gainer'),
     'super-mass-gainer', 'گینر سوپر مس', 'Super Mass Gainer',
     '<p>گینر پرکالری برای افزایش وزن.</p>', '<p>High-calorie mass gainer.</p>', 'ACTIVE', FALSE),
    ((SELECT id FROM brand WHERE slug = 'muscletech'), (SELECT id FROM category WHERE slug = 'amino'),
     'platinum-bcaa', 'بی‌سی‌ای‌ای پلاتینیوم', 'Platinum BCAA',
     '<p>آمینو اسیدهای شاخه‌دار.</p>', '<p>Branched-chain amino acids.</p>', 'ACTIVE', FALSE);

INSERT INTO variant (product_id, sku, flavour_fa, flavour_en, size_label, weight_grams, base_price, compare_at_price,
                     stock_on_hand, low_stock_threshold, active, sort_order)
VALUES
    ((SELECT id FROM product WHERE slug = 'gold-standard-isolate'), 'ON-ISO-CHOC-2KG', 'شکلات', 'Chocolate', '2 kg', 2000,
     12000000, 13500000, 20, 5, TRUE, 1),
    ((SELECT id FROM product WHERE slug = 'gold-standard-isolate'), 'ON-ISO-VAN-2KG', 'وانیل', 'Vanilla', '2 kg', 2000,
     12000000, NULL, 12, 5, TRUE, 2),
    ((SELECT id FROM product WHERE slug = 'super-mass-gainer'), 'DY-GAIN-CHOC-5KG', 'شکلات', 'Chocolate', '5 kg', 5000,
     8500000, NULL, 8, 3, TRUE, 1),
    ((SELECT id FROM product WHERE slug = 'platinum-bcaa'), 'MT-BCAA-FP-400G', 'پانچ میوه', 'Fruit Punch', '400 g', 400,
     3200000, NULL, 30, 10, TRUE, 1),
    ((SELECT id FROM product WHERE slug = 'platinum-bcaa'), 'MT-BCAA-BR-400G', 'تمشک آبی', 'Blue Raspberry', '400 g', 400,
     3200000, NULL, 0, 10, FALSE, 2);

INSERT INTO volume_tier (variant_id, min_qty, unit_price) VALUES
    ((SELECT id FROM variant WHERE sku = 'ON-ISO-CHOC-2KG'), 3, 11500000),
    ((SELECT id FROM variant WHERE sku = 'ON-ISO-CHOC-2KG'), 10, 11000000),
    ((SELECT id FROM variant WHERE sku = 'ON-ISO-VAN-2KG'), 5, 11400000),
    ((SELECT id FROM variant WHERE sku = 'MT-BCAA-FP-400G'), 4, 3000000);

-- One INITIAL ledger row per variant so the ledger reconciles with stock_on_hand.
INSERT INTO stock_movement (variant_id, delta, reason, note)
SELECT id, stock_on_hand, 'INITIAL', 'Dev seed' FROM variant WHERE stock_on_hand > 0;
