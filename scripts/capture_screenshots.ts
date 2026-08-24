import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function capture() {
  const outputDir = path.resolve(__dirname, '../docs/assets/screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop Control Center (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, 'desktop_control_center.png'), fullPage: false });
    await page.close();
  }

  // 2. Desktop Reconciliation with Evidence Drawer (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Reconciliation"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'desktop_reconciliation_drawer.png'), fullPage: false });
    await page.close();
  }

  // 3. Desktop Evaluation Lab (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Evaluation Lab"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'desktop_evaluation_lab.png'), fullPage: false });
    await page.close();
  }

  // 4. Desktop Help Workspace (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.locator('aside button[title*="Help & Guide"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'desktop_help_workspace.png'), fullPage: false });
    await page.close();
  }

  // 5. Desktop Live Runner Modal (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    const launchBtn = page.locator('button:has-text("Launch Live Runner")').first();
    await launchBtn.scrollIntoViewIfNeeded();
    await launchBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, 'desktop_live_runner.png'), fullPage: false });
    await page.close();
  }

  // 6. Tablet Control Center (1024x768)
  {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, 'tablet_control_center.png'), fullPage: false });
    await page.close();
  }

  // 7. Mobile Control Center (390x844)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, 'mobile_control_center.png'), fullPage: false });
    await page.close();
  }

  await browser.close();
  console.log('Screenshots captured successfully!');
}

capture().catch(console.error);
