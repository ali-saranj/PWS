-- Dev-only seed data (profile "dev"). Prices are Rials. No images, no staff (owner comes from bootstrap properties).

INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order) VALUES
    ('سوسیس و هات‌داگ', 'Sausages & Hot Dogs', 'sausages-hotdogs', NULL, 1),
    ('کالباس و ژامبون', 'Cold Cuts & Deli Meats', 'cold-cuts-deli', NULL, 2);

INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order)
SELECT 'ژامبون بوقلمون', 'Turkey Ham', 'turkey-ham', id, 1 FROM category WHERE slug = 'cold-cuts-deli';

INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order)
SELECT 'ژامبون گوشت', 'Beef Ham', 'beef-ham', id, 2 FROM category WHERE slug = 'cold-cuts-deli';

INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order) VALUES
    ('خیارشور و ترشیجات', 'Pickles & Condiments', 'pickles-condiments', NULL, 3),
    ('سس و چاشنی', 'Sauces & Condiments', 'sauces', NULL, 4),
    ('نان ساندویچی', 'Sandwich Breads', 'sandwich-bread', NULL, 5),
    ('چیپس و تنقلات', 'Chips & Snacks', 'chips-snacks', NULL, 6),
    ('کنسروجات', 'Canned Goods', 'canned-goods', NULL, 7);

INSERT INTO brand (name_fa, name_en, slug) VALUES
    ('آندره', 'Andre', 'andre'),
    ('۲۰۲', '202', 'brand-202'),
    ('یک‌و‌یک', 'Yek O Yek', 'yek-o-yek'),
    ('دلپذیر', 'Delpazir', 'delpazir'),
    ('کاله', 'Kalleh', 'kalleh');

INSERT INTO product (brand_id, category_id, slug, name_fa, name_en, description_fa, description_en, status, featured)
VALUES
    ((SELECT id FROM brand WHERE slug = 'andre'), (SELECT id FROM category WHERE slug = 'turkey-ham'),
     'andre-turkey-ham-90', 'ژامبون بوقلمون ۹۰٪ آندره', 'Andre 90% Turkey Ham',
     '<p>ژامبون بوقلمون ۹۰ درصد دودی مناسب انواع ساندویچ سرد و گرم.</p>', '<p>90% smoked turkey ham for hot and cold sandwiches.</p>', 'ACTIVE', TRUE),
    ((SELECT id FROM brand WHERE slug = 'brand-202'), (SELECT id FROM category WHERE slug = 'sausages-hotdogs'),
     '202-frankfurter', 'سوسیس فرانکفورتر ۲۰۲', '202 Frankfurter Sausage',
     '<p>سوسیس فرانکفورتر با بافت لطیف و طعم دودی اصیل.</p>', '<p>Frankfurter sausage with tender texture and authentic smoked flavor.</p>', 'ACTIVE', FALSE),
    ((SELECT id FROM brand WHERE slug = 'yek-o-yek'), (SELECT id FROM category WHERE slug = 'pickles-condiments'),
     'yek-o-yek-special-pickles', 'خیارشور ویژه یک‌و‌یک', 'Yek O Yek Special Pickles',
     '<p>خیارشور ترد و سرکه‌ای شیشه‌ای درجه یک.</p>', '<p>Crispy special vinegar pickles in premium jar.</p>', 'ACTIVE', FALSE);

INSERT INTO variant (product_id, sku, flavour_fa, flavour_en, size_label, weight_grams, base_price, compare_at_price,
                     stock_on_hand, low_stock_threshold, active, sort_order)
VALUES
    ((SELECT id FROM product WHERE slug = 'andre-turkey-ham-90'), 'AND-TURK-250G', 'ساده', 'Plain', '۲۵۰ گرم اسلایس', 250,
     1850000, 2100000, 25, 5, TRUE, 1),
    ((SELECT id FROM product WHERE slug = 'andre-turkey-ham-90'), 'AND-TURK-500G', 'ساده', 'Plain', '۵۰۰ گرم اسلایس', 500,
     3600000, NULL, 15, 5, TRUE, 2),
    ((SELECT id FROM product WHERE slug = '202-frankfurter'), '202-FRANK-500G', 'دودی', 'Smoked', '۵۰۰ گرم', 500,
     2400000, NULL, 20, 5, TRUE, 1),
    ((SELECT id FROM product WHERE slug = 'yek-o-yek-special-pickles'), 'YOY-PCK-680G', 'سرکه‌ای', 'Vinegar', '۶۸۰ گرم', 680,
     950000, NULL, 30, 10, TRUE, 1);

INSERT INTO volume_tier (variant_id, min_qty, unit_price) VALUES
    ((SELECT id FROM variant WHERE sku = 'AND-TURK-250G'), 3, 1750000),
    ((SELECT id FROM variant WHERE sku = 'AND-TURK-250G'), 10, 1650000),
    ((SELECT id FROM variant WHERE sku = 'AND-TURK-500G'), 4, 3400000),
    ((SELECT id FROM variant WHERE sku = '202-FRANK-500G'), 5, 2250000),
    ((SELECT id FROM variant WHERE sku = 'YOY-PCK-680G'), 6, 880000);

-- One INITIAL ledger row per variant so the ledger reconciles with stock_on_hand.
INSERT INTO stock_movement (variant_id, delta, reason, note)
SELECT id, stock_on_hand, 'INITIAL', 'Dev seed' FROM variant WHERE stock_on_hand > 0;
