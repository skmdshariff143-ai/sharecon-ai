import { test } from '@playwright/test';
import path from 'path';

test.describe('Screenshot Capture Suite', () => {
  const outputDir = path.resolve(__dirname, '../../docs/assets/screenshots');

  test('Capture Desktop Control Center (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, 'desktop_control_center.png'), fullPage: false });
  });

  test('Capture Desktop Reconciliation with Evidence Drawer (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Reconciliation"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'desktop_reconciliation_drawer.png'), fullPage: false });
  });

  test('Capture Desktop Evaluation Lab (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Evaluation Lab"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'desktop_evaluation_lab.png'), fullPage: false });
  });

  test('Capture Desktop Help Workspace (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Help & Guide"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'desktop_help_workspace.png'), fullPage: false });
  });

  test('Capture Desktop Live Runner (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const launchBtn = page.locator('button:has-text("Launch Live Runner")').first();
    await launchBtn.scrollIntoViewIfNeeded();
    await launchBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, 'desktop_live_runner.png'), fullPage: false });
  });

  test('Capture Tablet Control Center (1024x768)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, 'tablet_control_center.png'), fullPage: false });
  });

  test('Capture Mobile Control Center (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, 'mobile_control_center.png'), fullPage: false });
  });
});
