import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blurInputs, cards, collectConsoleErrors, onboardWithPacks, railBox, tabLink } from './helpers';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'legacy');

test.describe('core flows', () => {
  let errors: string[];
  test.beforeEach(async ({ page }) => {
    errors = collectConsoleErrors(page);
    await onboardWithPacks(page);
  });
  test.afterEach(() => {
    expect(errors, 'no console errors').toEqual([]);
  });

  test('onboarding installs six Boxes and the grid renders', async ({ page }) => {
    await expect(page.locator('nav[aria-label="Boxes"] a[href^="/b/"]')).toHaveCount(6);
    await expect(cards(page).first()).toBeVisible();
  });

  test('a card with variables asks for values and copies the rendered text', async ({ page }) => {
    await railBox(page, 'Email replies').click();
    const card = cards(page).filter({ hasText: /Hi \{\{name\}\}|\{\{name\}\}/ }).first();
    await card.hover();
    await card.locator('button[aria-label^="Fill & Copy"]').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input').first().fill('Alex');
    await dialog.getByRole('button', { name: /^Copy$/ }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Alex');
    expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain('{{');
  });

  test('table editor shows footer formulas and Escape closes it', async ({ page }) => {
    await railBox(page, 'Meeting follow-up').click();
    await tabLink(page, /Hours/).click();
    const card = cards(page).filter({ has: page.locator('table') }).first();
    await card.hover();
    await card.locator('button[aria-label="Edit"]').click();
    const footers = page.locator('input[placeholder="sum//all"]');
    await expect(footers.first()).toBeVisible();
    const values = await footers.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
    expect(values.some(Boolean)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(footers).toHaveCount(0);
    expect(page.url()).toMatch(/\/b\/[^/]+\/t\/[^/]+$/);
  });

  test('keyboard: palette, tab cycling, shortcuts help, paste and undo', async ({ page }) => {
    // Shell and Git has two Tabs, so tab cycling is observable in the URL.
    await railBox(page, 'Shell and Git').click();
    await expect(cards(page).first()).toBeVisible();
    await blurInputs(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.type('>');
    await expect(page.getByRole('dialog')).toContainText(/New|Theme|Settings/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    const before = page.url();
    await page.keyboard.press('Control+]');
    await expect.poll(() => page.url()).not.toBe(before);
    await page.keyboard.press('Control+[');
    await expect.poll(() => page.url()).toBe(before);

    await page.keyboard.press('Shift+?');
    await expect(page.getByRole('dialog')).toContainText(/K/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.evaluate(() => navigator.clipboard.writeText('Pasted from clipboard test'));
    const count = await cards(page).count();
    await blurInputs(page);
    await page.keyboard.press('Control+v');
    await expect(cards(page)).toHaveCount(count + 1);
    await expect(page.getByText('Pasted from clipboard test').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await blurInputs(page);
    await page.keyboard.press('Control+z');
    await expect(cards(page)).toHaveCount(count);
  });

  test('Quick Bar slot copies with Alt+1', async ({ page }) => {
    await railBox(page, 'Shell and Git').click();
    const card = cards(page).first();
    const title = await card.getAttribute('aria-label');
    await card.hover();
    await card.locator('button[aria-label="More"]').click();
    await page.getByRole('menuitem', { name: /Quick Bar slot/ }).hover();
    await page.getByRole('menuitemcheckbox', { name: /^Slot 1$/ }).or(page.getByRole('menuitem', { name: /^Slot 1$/ })).first().click();
    await expect(page.getByRole('toolbar', { name: /Quick Bar/i })).toContainText(title ?? '');
    await page.evaluate(() => navigator.clipboard.writeText(''));
    await blurInputs(page);
    await page.keyboard.press('Alt+1');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).not.toBe('');
  });

  test('Delete moves a card to Trash and restore brings it back', async ({ page }) => {
    const count = await cards(page).count();
    const first = cards(page).first();
    const title = await first.getAttribute('aria-label');
    await first.focus();
    await page.keyboard.press('Delete');
    await expect(cards(page)).toHaveCount(count - 1);
    await page.goto('/trash');
    await expect(page.getByText(title ?? '')).toBeVisible();
    await page.getByRole('button', { name: /Restore/ }).first().click();
    await expect(page.getByText(/^Restored/)).toBeVisible();
    await page.goBack();
    await expect(cards(page)).toHaveCount(count);
  });

  test('export downloads a format 2 file', async ({ page }) => {
    await page.goto('/settings/import-export');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Export$/ }).first().click()]);
    expect(download.suggestedFilename()).toMatch(/^boxy-.*\.json$/);
    const json = JSON.parse(fs.readFileSync((await download.path()) ?? '', 'utf8'));
    expect(json._meta).toMatchObject({ app: 'Boxy', format: 2, kind: 'full' });
    expect(json.boxes.length).toBe(6);
  });

  test('import of a full backup from the previous Boxy', async ({ page }) => {
    await page.goto('/import');
    await page.locator('input[type=file]').setInputFiles(path.join(FIXTURES, 'fixture-export-full.json'));
    await expect(page.getByText('Full backup from the previous Boxy')).toBeVisible();
    await expect(page.getByText(/1 Boxes, \d+ Tabs, \d+ Cards/)).toBeVisible();
    await page.getByRole('button', { name: /^Import$/ }).click();
    await expect(page.getByText('Import finished').first()).toBeVisible();
    await expect(page.locator('nav[aria-label="Boxes"] a[href^="/b/"]')).toHaveCount(7);
    await railBox(page, 'My Workspace').click();
    await tabLink(page, /Hours/).click();
    await expect(page.locator('[role=list]')).toContainText('Weekly hours');
    await expect(page.locator('[role=list]')).toContainText('14.5');
  });

  test('PWA shortcuts ?action=search and ?action=new-card are handled (B5)', async ({ page }) => {
    await page.goto('/?action=search');
    await page.waitForURL('**/b/**');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(page.url()).not.toContain('action=');
    await page.keyboard.press('Escape');
    await page.goto('/?action=new-card');
    await page.waitForURL('**/b/**');
    await expect(page.locator('input[aria-label="Title"]')).toBeVisible();
    expect(page.url()).not.toContain('action=');
  });

  test('reset requires typing DELETE', async ({ page }) => {
    await page.goto('/settings/storage');
    await page.getByRole('button', { name: /Delete everything/ }).click();
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: /Delete everything/ });
    await expect(confirm).toBeDisabled();
    await dialog.locator('input').fill('DELETE');
    await expect(confirm).toBeEnabled();
    await page.keyboard.press('Escape');
  });

  test('Indonesian locale renders without raw keys', async ({ page }) => {
    await page.goto('/settings/appearance');
    await page.locator('[role=group][aria-label="Language"] button', { hasText: 'Bahasa Indonesia' }).click();
    await expect(page.locator('body')).toContainText(/Tampilan|Bahasa/);
    await page.goto('/');
    await page.waitForURL('**/b/**');
    await expect(cards(page).first()).toBeVisible();
    const text = await page.locator('body').innerText();
    expect(text).toMatch(/Salin|Baru/);
    expect(text).not.toMatch(/\b(common|cards|shell|settings)\.[a-zA-Z]+\b/);
  });
});
