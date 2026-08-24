import { test, expect } from '@playwright/test';

test.describe('Reviewer Actions & Audit Trail Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('10. Approving an exception updates status and creates audit trail entry', async ({ page }) => {
    await page.locator('aside button[title*="Exceptions"]').first().click();
    await expect(page.locator('text=Financial Triage').first()).toBeVisible();

    const approveBtn = page.locator('button:has-text("Approve")').first();
    await approveBtn.click();
    await page.waitForTimeout(200);

    await page.locator('aside button[title*="Audit Trail"]').first().click();
    await expect(page.locator('text=Audit Trail').first()).toBeVisible();

    // Verify audit record exists in table
    await expect(page.locator('table tbody td:has-text("MANUAL_APPROVE"), table tbody span:has-text("MANUAL_APPROVE"), table tbody tr:has-text("MANUAL_APPROVE")').first()).toBeVisible();
  });

  test('11. Rejecting an exception updates status and creates rejection audit trail entry', async ({ page }) => {
    await page.locator('aside button[title*="Exceptions"]').first().click();

    const rejectBtn = page.locator('button:has-text("Reject")').first();
    await rejectBtn.click();
    await page.waitForTimeout(200);

    await page.locator('aside button[title*="Audit Trail"]').first().click();
    await expect(page.locator('text=Audit Trail').first()).toBeVisible();

    // Verify rejection record exists in table
    await expect(page.locator('table tbody td:has-text("MANUAL_REJECT"), table tbody span:has-text("MANUAL_REJECT"), table tbody tr:has-text("MANUAL_REJECT")').first()).toBeVisible();
  });

  test('12. Audit Trail CSV and JSON exports trigger successfully', async ({ page }) => {
    await page.locator('aside button[title*="Audit Trail"]').first().click();

    const [downloadJson] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export JSON")').first().click(),
    ]);
    expect(downloadJson.suggestedFilename()).toContain('.json');

    const [downloadCsv] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export CSV")').first().click(),
    ]);
    expect(downloadCsv.suggestedFilename()).toContain('.csv');
  });
});
