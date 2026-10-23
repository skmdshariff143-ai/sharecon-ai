import { test, expect } from '@playwright/test';

test.describe('Universal Pre-Launch Master Audit Suite', () => {
  test('01 & 02. Privacy Policy and Terms pages render and navigate cleanly', async ({ page }) => {
    // 1. Visit Privacy Policy
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await expect(page.locator('text=zero-server-persistence invariant').first()).toBeVisible();
    await expect(page.locator('text=Zero Tracking Cookies').first()).toBeVisible();

    // Navigate back to Control Center
    const returnLink = page.locator('a:has-text("Return to Control Center")').first();
    await returnLink.click();
    await expect(page).toHaveURL('/');

    // 2. Visit Terms & Conditions
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms & Conditions');
    await expect(page.locator('text=Critical Financial Advisory Disclaimer').first()).toBeVisible();
    await expect(page.locator('text=Zero Fund Movement').first()).toBeVisible();

    // Navigate back to Control Center
    await page.locator('a:has-text("Return to Control Center")').first().click();
    await expect(page).toHaveURL('/');
  });

  test('04. Security Headers & HSTS configuration', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('06 & 07. SEO Metadata, Open Graph, and Canonical URLs', async ({ page }) => {
    await page.goto('/');

    // Title & Description
    await expect(page).toHaveTitle(/ShaRecon AI/);
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /3-way/i);

    // Canonical link
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /sharecon-ai\.vercel\.app/);

    // OpenGraph
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /ShaRecon AI/);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute('content', 'website');
  });

  test('09. Robots and Sitemap routes respond with valid directives', async ({ request }) => {
    // robots.txt
    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain('User-Agent: *');
    expect(robotsText).toContain('Allow: /');
    expect(robotsText).toContain('Disallow: /api/');
    expect(robotsText).toContain('Sitemap:');

    // sitemap.xml
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    const sitemapText = await sitemapRes.text();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).toContain('/privacy');
    expect(sitemapText).toContain('/terms');
  });

  test('15. Custom Branded 404 Page preserves 404 status and navigates to Control Center', async ({ page }) => {
    const response = await page.goto('/non-existent-sample-page-404');
    expect(response?.status()).toBe(404);

    await expect(page.locator('h1')).toContainText('Workspace Not Found');
    await expect(page.locator('text=HTTP 404 • Resource Missing')).toBeVisible();

    // CTA button navigates to home
    const homeBtn = page.locator('a:has-text("Control Center")').first();
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('header.glass-command-bar')).toBeVisible();
  });
});
