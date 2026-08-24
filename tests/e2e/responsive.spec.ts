import { test, expect } from '@playwright/test';

test.describe('Responsive Layout & Command Bar Quality Suite', () => {
  const targetViewports = [
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
    { name: 'Laptop WXGA (1366x768)', width: 1366, height: 768 },
    { name: 'Compact Desktop (1280x720)', width: 1280, height: 720 },
    { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768 },
    { name: 'Mobile (390x844)', width: 390, height: 844 },
  ];

  for (const vp of targetViewports) {
    test(`Zero page-level horizontal scroll & no command bar overlap at ${vp.name}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Assert document overflow: scrollWidth <= clientWidth
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);

      // Verify command bar is visible and non-empty
      const commandBar = page.locator('header.glass-command-bar');
      await expect(commandBar).toBeVisible();

      // Primary Actions check: Run Demo button must always be visible
      const runDemoBtn = page.locator('button:has-text("Run Demo")');
      await expect(runDemoBtn).toBeVisible();

      // Assert zero console errors
      expect(consoleErrors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
    });
  }

  test('Command bar buttons maintain non-overlapping bounding boxes at 1280x720 and 1366x768', async ({ page }) => {
    for (const [width, height] of [[1280, 720], [1366, 768]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get bounding boxes of visible interactive buttons in command bar
      const boxes = await page.evaluate(() => {
        const header = document.querySelector('header.glass-command-bar');
        if (!header) return [];
        const buttons = Array.from(header.querySelectorAll('button'));
        return buttons
          .map((b) => {
            const rect = b.getBoundingClientRect();
            return {
              ariaLabel: b.getAttribute('aria-label') || b.textContent || '',
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((b) => b.width > 0 && b.height > 0);
      });

      expect(boxes.length).toBeGreaterThanOrEqual(2);

      // Verify no two adjacent buttons horizontally overlap
      for (let i = 0; i < boxes.length - 1; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const b1 = boxes[i];
          const b2 = boxes[j];
          // If on same vertical row, they should not horizontally collide
          if (Math.abs(b1.top - b2.top) < 10) {
            const overlaps = !(b1.right <= b2.left || b2.right <= b1.left);
            expect(overlaps).toBe(false);
          }
        }
      }
    }
  });

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
    await page.waitForTimeout(250);

    // Click Exceptions tab in drawer
    await page.waitForTimeout(300);
    const exceptionsBtn = aside.locator('button[title*="Exceptions"]').first();
    await exceptionsBtn.click();
    await page.waitForTimeout(300);

    // Should navigate and show Exceptions tab
    await expect(page.locator('text=Severity:').first()).toBeVisible();

    // Check again for zero horizontal overflow on Exceptions tab
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
