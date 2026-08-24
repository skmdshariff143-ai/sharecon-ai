import { test, expect } from '@playwright/test';

test.describe('Help Workspace & Live Runner Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('17. Help & Guide workspace displays 3-way lifecycle, 4-factor math, and searchable FAQ', async ({ page }) => {
    await page.locator('aside button[title*="Help & Guide"]').first().click();
    await expect(page.locator('text=How ShaRecon AI Works').first()).toBeVisible();

    await expect(page.locator('text=The 3-Way Reconciliation Lifecycle').first()).toBeVisible();
    await expect(page.locator('text=Leg 1: Merchant Ledger').first()).toBeVisible();
    await expect(page.locator('text=Leg 2: Nodal Settlement').first()).toBeVisible();
    await expect(page.locator('text=Leg 3: Bank Account').first()).toBeVisible();

    await expect(page.locator('text=Deterministic 4-Factor Confidence Scoring').first()).toBeVisible();

    const faqSearch = page.locator('input[placeholder*="Search concepts"]').first();
    await faqSearch.fill('MDR');
    await expect(page.locator('text=Why do settled amounts differ from payment gross amounts?').first()).toBeVisible();
  });

  test('18. Live Reconciliation Runner steps through observable engine stages', async ({ page }) => {
    const launchBtn = page.locator('button:has-text("Launch Live Runner")').first();
    await launchBtn.scrollIntoViewIfNeeded();
    await launchBtn.click();

    const runnerModal = page.locator('[role="dialog"][aria-labelledby="live-runner-title"]');
    await expect(runnerModal).toBeVisible();

    // Verify stage 1 heading
    await expect(runnerModal.locator('h4:has-text("1. Source Schema & Statement Validation")').first()).toBeVisible();

    // Click Pause
    const pauseBtn = runnerModal.locator('button:has-text("Pause")');
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await expect(runnerModal.locator('button:has-text("Resume")')).toBeVisible();
    }

    // Skip to end
    const skipBtn = runnerModal.locator('button:has-text("Skip to End")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await expect(runnerModal.locator('text=View Reconciled Results').first()).toBeVisible();
    }

    // Close runner
    const closeBtn = runnerModal.locator('button:has-text("View Reconciled Results"), button:has-text("Close Runner")').first();
    await closeBtn.click();
    await expect(runnerModal).not.toBeVisible();
  });
});
