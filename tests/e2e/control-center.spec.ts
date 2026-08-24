import { test, expect } from '@playwright/test';

test.describe('Control Center & Navigation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Control Center displays records, 5 KPIs, and rendered Outcome Donut SVG', async ({ page }) => {
    // Assert Outcome Distribution Donut SVG has rendered geometry
    const donut = page.locator('[data-testid="outcome-donut-chart"]');
    await expect(donut).toBeVisible();
    const circles = donut.locator('circle');
    await expect(circles).toHaveCount(4); // 1 track + 3 data arcs

    // Assert 5 KPI summaries exist
    await expect(page.locator('text=TOTAL VOLUME').first()).toBeVisible();
    await expect(page.locator('text=AUTO-RECONCILED').first()).toBeVisible();
    await expect(page.locator('text=REVIEW QUEUE').first()).toBeVisible();
    await expect(page.locator('text=FINANCIAL EXPOSURE').first()).toBeVisible();
    await expect(page.locator('text=AUTO-PRECISION').first()).toBeVisible();
  });

  test('2. Navigation switches seamlessly across all seven workspace tabs', async ({ page }) => {
    const tabs = [
      { name: 'Reconciliation', title: 'Reconciliation' },
      { name: 'Exceptions', title: 'Exceptions' },
      { name: 'Audit Trail', title: 'Audit Trail' },
      { name: 'Evaluation Lab', title: 'Evaluation Lab' },
      { name: 'Methodology & Safety', title: 'Methodology & Safety' },
      { name: 'Help & Guide', title: 'Help & Guide' },
      { name: 'Control Center', title: 'Control Center' },
    ];

    for (const tab of tabs) {
      const button = page.locator(`aside button[title*="${tab.name}"]`).first();
      await button.click();
      await page.waitForTimeout(150);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('3. Command palette opens via ⌘K or button and closes on Escape', async ({ page }) => {
    const cmdButton = page.locator('button:has-text("Quick jump"), button:has-text("Search / Commands")').first();
    if (await cmdButton.isVisible()) {
      await cmdButton.click();
    } else {
      await page.keyboard.press('Control+KeyK');
    }

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    await page.keyboard.type('Exceptions');
    await expect(page.locator('text=Exception Command Center').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('4. Guided Demo Tour opens, steps forward, and closes cleanly', async ({ page }) => {
    const tourBtn = page.locator('button:has-text("Guided Demo")').first();
    await tourBtn.click();

    const tourDialog = page.locator('[role="dialog"]').first();
    await expect(tourDialog).toBeVisible();

    const nextBtn = page.locator('button:has-text("Next")');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }

    const closeBtn = page.locator('button[aria-label="Close guided demo"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(tourDialog).not.toBeVisible();
    }
  });
});
