import { test } from '@playwright/test';
import path from 'path';

test('capture screenshots', async ({ page }) => {
  // 1. Capture the Landing Page (Hero Section)
  const lpPath = `file://${path.resolve('lp/index.html')}`;
  await page.goto(lpPath);
  await page.setViewportSize({ width: 1280, height: 800 });

  // Wait for fonts/images to load
  await page.waitForLoadState('networkidle');

  // Take full hero screenshot
  await page.screenshot({ path: 'lp/hero_real.png' });
  console.log('Saved lp/hero_real.png');

  // 2. Capture a "Service Screenshot" by mocking Danmaku on a cinematic visual
  // We can use the existing LP structure but focus on the hero contents or a dedicated mock section.
  // For now, let's just take a clean shot of the hero without text if possible, 
  // or a specific element.

  const heroMockup = await page.$('.hero__mockup');
  if (heroMockup) {
    await heroMockup.screenshot({ path: 'client/public/service_screenshot_real.png' });
    console.log('Saved client/public/service_screenshot_real.png');
  }

  // 3. Realistic Mockup (Laptop feel)
  // Since we are in Playwright, we are already in a real browser.
  // We can just capture the viewport for a "raw" feel.
  await page.screenshot({ path: 'client/public/promo_mockup_real.png' });
  console.log('Saved client/public/promo_mockup_real.png');
});
