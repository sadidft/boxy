import { expect, type Page } from '@playwright/test';

/** Completes onboarding with every Starter Pack selected and lands on the first Box. */
export async function onboardWithPacks(page: Page, packs: 'all' | 'default' = 'all'): Promise<void> {
  await page.goto('/');
  await page.waitForURL('**/onboarding');
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.getByRole('button', { name: /Start with a Starter Pack/ }).click();
  if (packs === 'all') {
    const boxes = page.locator('input[type=checkbox]');
    const n = await boxes.count();
    for (let i = 0; i < n; i++) if (!(await boxes.nth(i).isChecked())) await boxes.nth(i).check();
  }
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.getByRole('button', { name: /Start using Boxy/ }).click();
  await page.waitForURL('**/b/**');
  await expect(page.locator('[role=list] article').first()).toBeVisible();
}

export const railBox = (page: Page, name: string) => page.locator('nav[aria-label="Boxes"]').locator(`a[aria-label="${name}"]`);
export const tabLink = (page: Page, name: string | RegExp) => page.locator('a[href*="/t/"]').filter({ hasText: name }).first();
export const cards = (page: Page) => page.locator('[role=list] article');

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** Clicks somewhere neutral so global shortcuts (not an input) receive the next key press. */
export async function blurInputs(page: Page): Promise<void> {
  await page.locator('body').click({ position: { x: 700, y: 600 } });
}
