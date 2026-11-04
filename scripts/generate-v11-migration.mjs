import fs from 'node:fs';
import path from 'node:path';

const categoryMap = {
  'خیارشور': { slug: 'pickles', nameEn: 'Pickles', sort: 1 },
  'ترشیجات': { slug: 'pickled-vegetables', nameEn: 'Pickled Vegetables', sort: 2 },
  'زیتون': { slug: 'olives', nameEn: 'Olives', sort: 3 },
  'رب گوجه': { slug: 'tomato-paste', nameEn: 'Tomato Paste', sort: 4 },
  'پنیر': { slug: 'cheese', nameEn: 'Cheese', sort: 5 },
  'ذرت': { slug: 'corn', nameEn: 'Corn', sort: 6 },
  'سیب‌زمینی نیمه‌آماده': { slug: 'semi-prepared-potatoes', nameEn: 'Semi-Prepared Potatoes', sort: 7 },
  'سس و چاشنی': { slug: 'sauces-condiments', nameEn: 'Sauces & Condiments', sort: 8 },
  'سوسیس و کالباس': { slug: 'sausages-deli-meats', nameEn: 'Sausages & Deli Meats', sort: 9 }
};

const brandMap = {
  'رهنمود': { slug: 'rahnamoud', nameEn: 'Rahnamoud' },
  'باسنی': { slug: 'basani', nameEn: 'Basani' },
  'کارگاهی / سنتی': { slug: 'traditional-craft', nameEn: 'Traditional & Craft' },
  'دادفر': { slug: 'dadfar', nameEn: 'Dadfar' },
  'آریامنش': { slug: 'aryamanesh', nameEn: 'Aryamanesh' },
  'راغب': { slug: 'ragheb', nameEn: 'Ragheb' },
  'مزرعه سبز': { slug: 'mazraeh-sabz', nameEn: 'Mazraeh Sabz' },
  'پسه': { slug: 'peseh', nameEn: 'Peseh' },
  'هدف': { slug: 'hadaf', nameEn: 'Hadaf' },
  'بارلی': { slug: 'barley', nameEn: 'Barley' },
  'الکا': { slug: 'elka', nameEn: 'Elka' },
  'اشینه': { slug: 'ashineh', nameEn: 'Ashineh' },
  'تابک': { slug: 'tabak', nameEn: 'Tabak' },
  'سروش': { slug: 'soroush', nameEn: 'Soroush' }
};

const mdPath = path.resolve('product list/لیست_محصولات_تبدیل_شده.md');
const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim().startsWith('|'));

const rows = [];
for (let i = 2; i < lines.length; i++) {
  const cols = lines[i].split('|').map(c => c.trim());
  const data = cols.slice(1, cols.length - 1);
  if (data.length < 15) continue;
  
  const [
    sku, nameFa, categoryFa, brandFa, sizeLabel,
    weightStr, ourPriceStr, consumerPriceStr, factoryPriceStr,
    stockStr, minQtyStr, wholesalePriceStr, status, imageRef, notes
  ] = data;

  const ourPriceToman = parseInt(ourPriceStr.replace(/,/g, ''), 10) || 0;
  const consumerPriceToman = parseInt(consumerPriceStr.replace(/,/g, ''), 10) || 0;
  const wholesaleMinQty = parseInt(minQtyStr.replace(/,/g, ''), 10) || 0;
  const wholesalePriceToman = parseInt(wholesalePriceStr.replace(/,/g, ''), 10) || 0;

  rows.push({
    sku,
    slug: `pws-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    nameFa: nameFa.replace(/'/g, "''"),
    category: categoryMap[categoryFa],
    brand: brandMap[brandFa],
    sizeLabel: sizeLabel.replace(/'/g, "''"),
    weightGrams: parseInt(weightStr.replace(/,/g, ''), 10) || 0,
    basePriceRials: ourPriceToman * 10,
    compareAtPriceRials: consumerPriceToman > ourPriceToman ? consumerPriceToman * 10 : null,
    stockOnHand: parseInt(stockStr.replace(/,/g, ''), 10) || 0,
    wholesaleMinQty,
    wholesalePriceRials: wholesalePriceToman * 10,
    status: status || 'ACTIVE',
    notes: notes ? notes.replace(/'/g, "''") : ''
  });
}

let sql = `-- Migration V11: Initial Catalog Data
-- Inserts canonical categories, brands, products, variants, volume tiers, and initial stock movements.

-- 1. Categories
INSERT INTO category (name_fa, name_en, slug, parent_id, sort_order) VALUES
`;

const catEntries = Object.entries(categoryMap);
sql += catEntries.map(([fa, info]) => 
  `    ('${fa.replace(/'/g, "''")}', '${info.nameEn}', '${info.slug}', NULL, ${info.sort})`
).join(',\n') + '\nON CONFLICT (slug) DO NOTHING;\n\n';

// Brands
sql += `-- 2. Brands
INSERT INTO brand (name_fa, name_en, slug) VALUES
`;
const brandEntries = Object.entries(brandMap);
sql += brandEntries.map(([fa, info]) => 
  `    ('${fa.replace(/'/g, "''")}', '${info.nameEn}', '${info.slug}')`
).join(',\n') + '\nON CONFLICT (slug) DO NOTHING;\n\n';

// Products
sql += `-- 3. Products
INSERT INTO product (brand_id, category_id, slug, name_fa, name_en, description_fa, description_en, status, featured) VALUES
`;
sql += rows.map(r => {
  const desc = `<p>${r.nameFa} - بسته‌بندی ${r.sizeLabel}، وزن ${r.weightGrams} گرم</p>${r.notes ? `<p>${r.notes}</p>` : ''}`;
  return `    ((SELECT id FROM brand WHERE slug = '${r.brand.slug}'), (SELECT id FROM category WHERE slug = '${r.category.slug}'), '${r.slug}', '${r.nameFa}', '${r.slug}', '${desc.replace(/'/g, "''")}', NULL, '${r.status}', FALSE)`;
}).join(',\n') + '\nON CONFLICT (slug) DO NOTHING;\n\n';

// Variants
sql += `-- 4. Variants
INSERT INTO variant (product_id, sku, flavour_fa, flavour_en, size_label, weight_grams, base_price, compare_at_price, stock_on_hand, low_stock_threshold, active, sort_order) VALUES
`;
sql += rows.map(r => {
  const compareAt = r.compareAtPriceRials !== null ? r.compareAtPriceRials : 'NULL';
  return `    ((SELECT id FROM product WHERE slug = '${r.slug}'), '${r.sku}', NULL, NULL, '${r.sizeLabel}', ${r.weightGrams}, ${r.basePriceRials}, ${compareAt}, ${r.stockOnHand}, 5, TRUE, 1)`;
}).join(',\n') + '\nON CONFLICT (sku) DO NOTHING;\n\n';

// Volume Tiers
sql += `-- 5. Wholesale Volume Tiers
INSERT INTO volume_tier (variant_id, min_qty, unit_price) VALUES
`;
const tierRows = rows.filter(r => r.wholesaleMinQty >= 2 && r.wholesalePriceRials > 0);
sql += tierRows.map(r => {
  return `    ((SELECT id FROM variant WHERE sku = '${r.sku}'), ${r.wholesaleMinQty}, ${r.wholesalePriceRials})`;
}).join(',\n') + '\nON CONFLICT (variant_id, min_qty) DO NOTHING;\n\n';

// Stock movements
sql += `-- 6. Initial Stock Movements for Variant Stock Reconciliation
INSERT INTO stock_movement (variant_id, delta, reason, note)
SELECT v.id, v.stock_on_hand, 'INITIAL', 'Initial catalog migration V11'
FROM variant v
WHERE v.sku IN (${rows.map(r => `'${r.sku}'`).join(', ')})
  AND v.stock_on_hand > 0
  AND NOT EXISTS (
      SELECT 1 FROM stock_movement sm WHERE sm.variant_id = v.id AND sm.reason = 'INITIAL'
  );
`;

const outPath = path.resolve('api/src/main/resources/db/migration/V11__initial_catalog_data.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Generated migration written to ${outPath} (${sql.split('\n').length} lines).`);
