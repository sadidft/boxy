import { expect, test } from '@playwright/test';
import { cards, collectConsoleErrors, onboardWithPacks } from './helpers';

test('mobile shell: grid, bottom navigation and editor', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await onboardWithPacks(page, 'default');
  await expect(cards(page).first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Boxes' })).toBeHidden();
  const first = cards(page).first();
  await first.locator('button[aria-label="Edit"]').click();
  await expect(page.locator('input[aria-label="Title"], input[placeholder]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
