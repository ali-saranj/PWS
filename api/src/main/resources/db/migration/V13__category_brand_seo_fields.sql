-- Add optional SEO metadata columns to category and brand tables
ALTER TABLE category
    ADD COLUMN seo_title VARCHAR(160),
    ADD COLUMN seo_description VARCHAR(320),
    ADD COLUMN seo_h1 VARCHAR(200),
    ADD COLUMN seo_content_fa TEXT;

ALTER TABLE brand
    ADD COLUMN seo_title VARCHAR(160),
    ADD COLUMN seo_description VARCHAR(320),
    ADD COLUMN seo_h1 VARCHAR(200),
    ADD COLUMN seo_content_fa TEXT;

-- Initial SEO metadata for core categories (safe no-op if slug is absent)
UPDATE category
SET seo_title = 'خرید سوسیس و کالباس آنلاین | ژامبون و بیکن تازه در اصفهان',
    seo_description = 'خرید آنلاین سوسیس و کالباس، ژامبون مرغ، گوشت و بوقلمون، بیکن درصد بالا و هات‌داگ تازه از برندهای آندره، کاله و ۲۰۲ با ارسال سریع و بسته‌بندی عایق در اصفهان.',
    seo_h1 = 'خرید سوسیس و کالباس، ژامبون و بیکن ممتاز در اصفهان',
    seo_content_fa = 'در این بخش می‌توانید انواع سوسیس، هات‌داگ، کالباس خشک ممتاز، ژامبون گوشت و مرغ و بوقلمون و بیکن درصد بالا را با ضمانت اصالت و تازگی تهیه کنید. تمامی سفارش‌ها با بسته‌بندی عایق و زنجیره سرد در اصفهان ارسال می‌شوند.'
WHERE slug = 'sausages-deli-meats';

UPDATE category
SET seo_title = 'خرید پنیر پیتزا و گودا | پنیر ورقه‌ای برگر در اصفهان',
    seo_description = 'خرید آنلاین پنیر پیتزا کشدار، پنیر گودا و پنیر ورقه‌ای برگر با تاریخ روز و بسته‌بندی عایق زنجیره سرد و ارسال سریع در اصفهان.',
    seo_h1 = 'خرید پنیر پیتزا کشدار، پنیر گودا و ورقه‌ای برگر',
    seo_content_fa = 'عرضه مستقیم انواع پنیر پیتزا کشدار، پنیر گودا، چدار و پنیر ورقه‌ای مخصوص برگر و ساندویچ مناسب مصرف خانگی و فست‌فودها در اصفهان.'
WHERE slug = 'cheese';

UPDATE category
SET seo_title = 'خرید خیارشور ممتاز و ویژه در اصفهان | دبه‌ای و شیشه‌ای',
    seo_description = 'خرید آنلاین خیارشور ویژه ترد و ممتاز به صورت خرده‌فروشی و دبه‌ای مخصوص ساندویچی و فست‌فود با ارسال سریع در اصفهان.',
    seo_h1 = 'خرید خیارشور ممتاز و ویژه ترد در اصفهان',
    seo_content_fa = 'انواع خیارشور نول، ویژه و ممتاز ترد در بسته‌بندی خانگی و دبه‌ای مناسب ساندویچی‌ها و آشپزخانه‌ها با ضمانت کیفیت.'
WHERE slug = 'pickles';

UPDATE category
SET seo_title = 'خرید ترشیجات اصیل و چاشنی ساندویچ در اصفهان',
    seo_description = 'خرید آنلاین انواع ترشیجات اصیل و چاشنی‌های ساندویچی با طعم خانگی و ارسال سریع در اصفهان.',
    seo_h1 = 'خرید ترشیجات اصیل و خانگی در اصفهان'
WHERE slug = 'pickled-vegetables';

UPDATE category
SET seo_title = 'خرید سس و چاشنی مخصوص ساندویچ و فست‌فود',
    seo_description = 'خرید آنلاین انواع سس‌های دیپ، سس کچاپ، مایونز، فرانسوی و چاشنی‌های مخصوص برگر و ساندویچ در اصفهان.',
    seo_h1 = 'خرید سس و چاشنی‌های مخصوص ساندویچ و پیتزا'
WHERE slug = 'sauces-condiments';

UPDATE category
SET seo_title = 'خرید سیب‌زمینی نیمه‌آماده خلالی و فست‌فودی',
    seo_description = 'خرید آنلاین سیب‌زمینی نیمه‌آماده خلالی و فرنچ فرایز تازه و منجمد مناسب خانه و فست‌فود با ارسال زنجیره سرد در اصفهان.',
    seo_h1 = 'خرید سیب‌زمینی نیمه‌آماده و خلالی فست‌فودی'
WHERE slug = 'semi-prepared-potatoes';

-- Initial SEO metadata for partner brands
UPDATE brand
SET seo_title = 'خرید محصولات برند سروش | سوسیس و کالباس سروش',
    seo_description = 'خرید آنلاین انواع سوسیس، کالباس و ژامبون برند سروش با تاریخ روز، ضمانت اصالت و ارسال سریع با بسته‌بندی عایق در اصفهان.',
    seo_h1 = 'خرید محصولات برند سروش'
WHERE slug = 'soroush';
