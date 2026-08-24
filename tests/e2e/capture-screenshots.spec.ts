import { test, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Screenshot Capture Suite', () => {
  const outputDir = path.resolve(__dirname, '../../docs/assets/screenshots');
  const premiumDir = path.resolve(__dirname, '../../docs/assets/screenshots/premium');
  const darkPremiumDir = path.resolve(__dirname, '../../docs/assets/screenshots/dark-premium');

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(premiumDir)) fs.mkdirSync(premiumDir, { recursive: true });
    if (!fs.existsSync(darkPremiumDir)) fs.mkdirSync(darkPremiumDir, { recursive: true });
  });

  const saveScreenshots = async (page: Page, filename: string) => {
    await page.screenshot({ path: path.join(outputDir, filename), fullPage: false });
    await page.screenshot({ path: path.join(premiumDir, filename), fullPage: false });
    await page.screenshot({ path: path.join(darkPremiumDir, filename), fullPage: false });
  };

  test('Capture Desktop Control Center (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await saveScreenshots(page, 'desktop_control_center.png');
  });

  test('Capture Desktop Control Center (1280x800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await saveScreenshots(page, 'desktop_control_center_1280.png');
  });

  test('Capture Desktop Reconciliation with Evidence Drawer (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Reconciliation"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_reconciliation_drawer.png');
  });

  test('Capture Desktop Exceptions Workspace & Assistant (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Exceptions"]').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_exceptions.png');
  });

  test('Capture Desktop Evaluation Lab (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Evaluation Lab"]').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_evaluation_lab.png');
  });

  test('Capture Desktop Audit Trail (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Audit Trail"]').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_audit_trail.png');
  });

  test('Capture Desktop Methodology & Safety (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Methodology & Safety"]').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_methodology.png');
  });

  test('Capture Desktop Help Workspace (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Help & Guide"]').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_help_workspace.png');
  });

  test('Capture Desktop Live Runner (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const launchBtn = page.locator('button:has-text("Launch Live Runner")').first();
    await launchBtn.scrollIntoViewIfNeeded();
    await launchBtn.click();
    await page.waitForTimeout(400);
    await saveScreenshots(page, 'desktop_live_runner.png');
  });

  test('Capture Desktop Command Palette (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('header button[title*="Command Palette"]').first().click();
    await page.waitForTimeout(300);
    await saveScreenshots(page, 'desktop_command_palette.png');
  });

  test('Capture Tablet Control Center (1024x768)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await saveScreenshots(page, 'tablet_control_center.png');
  });

  test('Capture Tablet Portrait Control Center (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await saveScreenshots(page, 'tablet_portrait_control_center.png');
  });

  test('Capture Mobile Control Center (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await saveScreenshots(page, 'mobile_control_center.png');
  });

  test('Capture Mobile Control Center (360x800)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await saveScreenshots(page, 'mobile_control_center_360.png');
  });
});
