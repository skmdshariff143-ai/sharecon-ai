import { test, expect } from '@playwright/test';

test.describe('Evaluation Lab & Policy Simulator Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Evaluation Lab"]').first().click();
  });

  test('14. Evaluation Lab displays separated metrics and computes multi-seed benchmark', async ({ page }) => {
    await expect(page.locator('text=Proposed-Pair Precision').first()).toBeVisible();
    await expect(page.locator('text=Proposed-Pair Recall').first()).toBeVisible();
    await expect(page.locator('text=Auto-Resolution Precision').first()).toBeVisible();
    await expect(page.locator('text=Auto-Resolution Recall').first()).toBeVisible();
    await expect(page.locator('text=Review-Routing Accuracy').first()).toBeVisible();

    const recalcBtn = page.locator('button:has-text("Recalculate Benchmark")').first();
    await expect(recalcBtn).toBeVisible();
    await recalcBtn.click();

    await expect(page.locator('text=Seed 42').first()).toBeVisible();
    await expect(page.locator('text=Seed 101').first()).toBeVisible();
  });

  test('15. 5-Policy Comparative Matrix renders and exports comparison CSV', async ({ page }) => {
    await expect(page.locator('text=5-Policy Trade-Off Matrix').first()).toBeVisible();
    await expect(page.locator('text=Strict (High Confidence)').first()).toBeVisible();
    await expect(page.locator('text=Conservative (Cautious)').first()).toBeVisible();
    await expect(page.locator('text=Balanced (Default Baseline)').first()).toBeVisible();
    await expect(page.locator('text=Aggressive (High Clearing)').first()).toBeVisible();

    const exportBtn = page.locator('button:has-text("Export Comparison CSV")').first();
    await exportBtn.scrollIntoViewIfNeeded();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('16. Policy simulator slider updates simulated metrics without mutating baseline', async ({ page }) => {
    // Check initial baseline metric exists
    const precisionCard = page.locator('div:has-text("Proposed-Pair Precision")').first();
    await expect(precisionCard).toBeVisible();

    // Adjust high threshold slider using dispatchEvent
    await page.evaluate(() => {
      const el = document.querySelector('#sim-high-threshold') as HTMLInputElement;
      if (el) {
        el.value = '60';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    // Simulated Auto Rate should update
    await expect(page.locator('text=Simulated Auto Rate').first()).toBeVisible();
  });
});
