// Shared test helpers.
import { test } from '@playwright/test';

const TABS = ['play', 'shop', 'friends', 'event'];

// The site has tabs (Play, Shop, Friends, Event). If something isn't on the
// current tab, open the tab that has it, like a child would.
export async function reveal(locator) {
  if (await locator.isVisible()) return;
  const page = locator.page();
  for (const t of TABS) {
    await page.locator('#tab-' + t).click();
    if (await locator.isVisible()) return;
  }
}

// Tap on the iPad project, click on desktop.
export async function press(locator) {
  await reveal(locator);
  return test.info().project.use.hasTouch ? locator.tap() : locator.click();
}

export async function fillIn(locator, text) {
  await reveal(locator);
  await locator.fill(text);
}
