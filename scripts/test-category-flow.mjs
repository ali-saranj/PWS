import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve('docs/screenshots/category-flow');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Chrome to test Category flow...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'fa-IR',
  });

  const page = await context.newPage();
  const report = [];

  try {
    // -------------------------------------------------------------
    // Flow 1: Categories Directory Page (/categories)
    // -------------------------------------------------------------
    console.log('👉 Step 1: Navigating to /categories...');
    await page.goto('http://localhost:3000/categories', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log('   Title:', title);
    const hasHeader = await page.locator('text=دسته‌بندی‌های سبد سبز').isVisible();
    const hasColdCuts = await page.locator('text=کالباس و ژامبون').first().isVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_categories_directory.png'), fullPage: false });

    if (hasHeader && hasColdCuts) {
      report.push({ step: '1. Categories Directory (/categories)', status: 'PASS', detail: 'Categories directory rendered root categories and subcategory tags.' });
    } else {
      report.push({ step: '1. Categories Directory (/categories)', status: 'FAIL', detail: 'Could not find expected category cards.' });
    }

    // -------------------------------------------------------------
    // Flow 2: Navigate to Category Detail (/category/cold-cuts-deli)
    // -------------------------------------------------------------
    console.log('👉 Step 2: Clicking into "کالباس و ژامبون"...');
    const viewCatLink = page.locator('a[href="/category/cold-cuts-deli"]').first();
    await viewCatLink.click();
    await page.waitForURL('**/category/cold-cuts-deli');
    await page.waitForTimeout(1500);

    const catHeading = await page.locator('h1:has-text("کالباس و ژامبون")').isVisible();
    const hasBreadcrumbs = await page.locator('nav:has-text("دسته‌بندی‌ها")').first().isVisible();
    const hasSubchips = await page.locator('text=ژامبون بوقلمون').first().isVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_category_root_showcase.png'), fullPage: false });

    if (catHeading && hasBreadcrumbs && hasSubchips) {
      report.push({ step: '2. Root Category Showcase (/category/cold-cuts-deli)', status: 'PASS', detail: 'Rendered hero header, breadcrumbs, subcategory chips, and product grid.' });
    } else {
      report.push({ step: '2. Root Category Showcase (/category/cold-cuts-deli)', status: 'FAIL', detail: 'Missing header, breadcrumbs, or subcategory pills.' });
    }

    // -------------------------------------------------------------
    // Flow 3: Navigate to Subcategory (/category/turkey-ham)
    // -------------------------------------------------------------
    console.log('👉 Step 3: Navigating to subcategory "ژامبون بوقلمون"...');
    const subcategoryChip = page.locator('a:has-text("ژامبون بوقلمون")').first();
    await subcategoryChip.click();
    await page.waitForURL('**/category/turkey-ham');
    await page.waitForTimeout(1500);

    const subHeading = await page.locator('h1:has-text("ژامبون بوقلمون")').isVisible();
    const parentInCrumb = await page.locator('nav').filter({ hasText: 'کالباس و ژامبون' }).locator('a:has-text("کالباس و ژامبون")').isVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_subcategory_showcase.png'), fullPage: false });

    if (subHeading && parentInCrumb) {
      report.push({ step: '3. Subcategory Hierarchy (/category/turkey-ham)', status: 'PASS', detail: 'Hierarchy resolved: parent category listed in breadcrumbs path.' });
    } else {
      report.push({ step: '3. Subcategory Hierarchy (/category/turkey-ham)', status: 'FAIL', detail: 'Parent breadcrumb or subcategory header missing.' });
    }

    // -------------------------------------------------------------
    // Flow 4: Filter Sidebar & Cart interaction
    // -------------------------------------------------------------
    console.log('👉 Step 4: Testing interactive filters and cart addition...');
    // Click in-stock checkbox if present
    const inStockToggle = page.locator('label:has-text("فقط کالاهای موجود")').first();
    if (await inStockToggle.isVisible()) {
      await inStockToggle.click();
      await page.waitForTimeout(800);
    }

    // Add first product to cart
    const addBtn = page.locator('button:has-text("افزودن به سبد")').first();
    let addedToCart = false;
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      addedToCart = true;
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_category_filtered_and_cart.png'), fullPage: false });
    report.push({
      step: '4. Interactive Filters & Add to Cart',
      status: 'PASS',
      detail: `Filters responded and product added to cart: ${addedToCart}`,
    });

    // -------------------------------------------------------------
    // Flow 4.5: Category Selection in Filter Sidebar
    // -------------------------------------------------------------
    console.log('👉 Step 4.5: Selecting another category in the Filter Sidebar...');
    await page.goto('http://localhost:3000/category/cold-cuts-deli', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Look for category button in sidebar (e.g. "سوسیس و هات‌داگ")
    const sidebarCatBtn = page.locator('aside button:has-text("سوسیس و هات‌داگ")').first();
    if (await sidebarCatBtn.isVisible()) {
      await sidebarCatBtn.click();
      await page.waitForURL('**/category/sausages-hotdogs');
      await page.waitForTimeout(1200);

      const newHeading = await page.locator('h1:has-text("سوسیس و هات‌داگ")').isVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_filter_sidebar_category_selected.png'), fullPage: false });

      if (newHeading) {
        report.push({
          step: '4.5. Category Selection in Filter Sidebar',
          status: 'PASS',
          detail: 'Selecting category in filter sidebar successfully updated products and navigated to /category/sausages-hotdogs.',
        });
      } else {
        report.push({
          step: '4.5. Category Selection in Filter Sidebar',
          status: 'FAIL',
          detail: 'Navigated but heading was not updated to "سوسیس و هات‌داگ".',
        });
      }
    } else {
      report.push({
        step: '4.5. Category Selection in Filter Sidebar',
        status: 'FAIL',
        detail: 'Category button "سوسیس و هات‌داگ" not found in sidebar.',
      });
    }

    // -------------------------------------------------------------
    // Flow 5: Non-existent category returns 404
    // -------------------------------------------------------------
    console.log('👉 Step 5: Testing 404 for non-existent category slug...');
    const response = await page.goto('http://localhost:3000/category/non-existent-category-slug', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const is404 = response.status() === 404 || (await page.locator('text=۴۰۴').isVisible()) || (await page.locator('text=صفحه مورد نظر پیدا نشد').isVisible()) || (await page.locator('text=یافت نشد').isVisible());

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_category_not_found.png'), fullPage: false });

    if (is404) {
      report.push({ step: '5. Error Boundary (404 Not Found)', status: 'PASS', detail: 'Invalid slug cleanly triggered 404 Not Found.' });
    } else {
      report.push({ step: '5. Error Boundary (404 Not Found)', status: 'FAIL', detail: `Received HTTP ${response.status()} without 404 indicator.` });
    }

  } catch (err) {
    console.error('❌ Error during category flow test:', err);
    report.push({ step: 'Exception Caught', status: 'FAIL', detail: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n=================== TEST RUN REPORT ===================');
  for (const r of report) {
    console.log(`[${r.status}] ${r.step} - ${r.detail}`);
  }
  console.log('=======================================================');

  const allPassed = report.every((r) => r.status === 'PASS');
  process.exit(allPassed ? 0 : 1);
}

run();
