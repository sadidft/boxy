import { expect, test } from '@playwright/test';
import { LEGACY_ORIGIN, ROGUE_ORIGIN } from '../playwright.config';

test.describe('handoff from the previous Boxy (two origins)', () => {
  test('receives data from the allow-listed origin and confirms the receipt', async ({ context, page }) => {
    await page.goto(`${LEGACY_ORIGIN}/`);
    const [popup] = await Promise.all([context.waitForEvent('page'), page.click('#go')]);
    await popup.waitForLoadState();
    await expect(popup.getByText(/Data received from/).first()).toBeVisible();
    await expect.poll(() => page.title()).toBe('handoff-done');
    const receipt = await page.evaluate(() => (window as unknown as { __receipt: Record<string, number> }).__receipt);
    expect(receipt).toMatchObject({ boxes: 1, tabs: 3, cards: 5 });
    await expect(popup.getByText('Data saved by the previous Boxy')).toBeVisible();
    await popup.getByRole('button', { name: /^Import$/ }).click();
    await expect(popup.getByText('Import finished').first()).toBeVisible();
  });

  test('ignores an origin that is not allow-listed', async ({ context, page }) => {
    const [popup] = await Promise.all([context.waitForEvent('page'), page.goto(`${ROGUE_ORIGIN}/rogue`)]);
    await expect.poll(() => page.title(), { timeout: 10_000 }).toMatch(/rejected|accepted/);
    expect(await page.title()).toBe('rejected');
    expect(await page.evaluate(() => (window as unknown as { __gotReady: boolean }).__gotReady)).toBe(false);
    await popup.close();
  });
});
