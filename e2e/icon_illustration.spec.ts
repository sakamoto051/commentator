import { test } from '@playwright/test';
import path from 'path';

test('capture iconic illustration', async ({ page }) => {
  const htmlPath = `file://${path.resolve('e2e/iconMock.html')}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(htmlPath);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'client/public/icon_illustration.png' });
  console.log('Saved client/public/icon_illustration.png');
});
