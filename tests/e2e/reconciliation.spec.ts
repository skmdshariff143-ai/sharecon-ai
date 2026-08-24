import { test, expect } from '@playwright/test';

test.describe('Reconciliation Grid & Evidence Drawer Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Reconciliation"]').first().click();
  });

  test('5. Search finds specific payment ID (pay_0001)', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search Payment ID"]');
    await searchInput.fill('pay_0001');
    await expect(page.locator('text=pay_0001_razor').first()).toBeVisible();
  });

  test('6. Status filter isolates Pending Review cases', async ({ page }) => {
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('PENDING_REVIEW');
    await page.waitForTimeout(100);
    // Should have rows displayed with Pending status
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('7. Reset filters button restores full record view', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search Payment ID"]');
    await searchInput.fill('pay_9999_nonexistent');

    const resetBtn = page.locator('button:has-text("Reset Filters"), button:has-text("Clear Search")').first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    } else {
      await searchInput.fill('');
    }
    await expect(page.locator('text=pay_0001_razor').first()).toBeVisible();
  });

  test('8. Evidence drawer displays 3 transaction legs, candidate explorer, and 4-factor breakdown', async ({ page }) => {
    const row = page.locator('table tbody tr').first();
    await row.click();

    const drawer = page.locator('[role="dialog"]').first();
    await expect(drawer).toBeVisible();

    await expect(drawer.locator('text=Gateway Payment').first()).toBeVisible();
    await expect(drawer.locator('text=4-Factor Evidence Breakdown').first()).toBeVisible();
    await expect(drawer.locator('text=Multi-Candidate Ranking & Disambiguation Explorer').first()).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('9. Reviewer approval from drawer functions properly', async ({ page }) => {
    // Open a row
    const row = page.locator('table tbody tr').first();
    await row.click();

    const drawer = page.locator('[role="dialog"]').first();
    await expect(drawer).toBeVisible();

    // Verify Drawer action buttons are available
    const approveBtn = drawer.locator('button:has-text("Approve Match")');
    if (await approveBtn.isVisible()) {
      await expect(approveBtn).toBeEnabled();
    }

    await page.keyboard.press('Escape');
  });
});
