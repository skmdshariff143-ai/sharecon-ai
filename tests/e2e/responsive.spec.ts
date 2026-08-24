import { test, expect } from '@playwright/test';

test.describe('Responsive Layout & Zero Horizontal Overflow Suite', () => {
  const viewports = [
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
    { name: 'Tablet (1024px)', width: 1024, height: 768 },
    { name: 'Mobile (390px)', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`Zero page-level horizontal scroll at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check document overflow
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });
  }

  test('Mobile drawer navigation operates cleanly at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open mobile hamburger menu
    const menuBtn = page.locator('button[aria-label="Toggle navigation drawer"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Navigation rail drawer should be open
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();

    // Click Exceptions tab in drawer
    const exceptionsBtn = aside.locator('button[title*="Exceptions"]');
    await exceptionsBtn.click();

    // Should navigate and close drawer
    await expect(page.locator('text=Financial Triage & Exception Command Center')).toBeVisible();

    // Check again for zero horizontal overflow on Exceptions tab
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
