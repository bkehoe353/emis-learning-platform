import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('installable: manifest, icons and offline service worker', async ({ page, context, request }, info) => {
  test.skip(info.project.name !== 'desktop-chrome', 'Service worker check runs in Chromium');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) expect((await request.get('/' + icon.src)).ok()).toBe(true);
  expect((await request.get('/icons/apple-touch-icon.png')).ok()).toBe(true);

  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();   // now controlled by the service worker
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('footer')).toContainText('Made by Danny Kehoe');
  await page.getByRole('button', { name: 'Play Quick Quiz →' }).click();
  await expect(page.locator('#playArea')).toHaveClass(/active/);
});
