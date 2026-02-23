import { test } from '@playwright/test';
import path from 'path';

test('capture premium icon 128', async ({ page }) => {
  const htmlPath = `file://${path.resolve('e2e/icon128Mock.html')}`;
  await page.setViewportSize({ width: 128, height: 128 });
  await page.goto(htmlPath);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'client/public/icons/icon128_premium.png', omitBackground: true });
  console.log('Saved client/public/icons/icon128_premium.png');
});
