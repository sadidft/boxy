import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseLegacy, planLegacyImport } from './legacy';
import { applyLegacyPlan } from './apply';
import { listBoxes } from '../repo/boxes';
import { listCards } from '../repo/cards';
import { evaluateFormula } from '@/core/formula';
import type { TableBody } from '../types';

/** Fixtures produced by the real storage module of the previous Boxy (scripts/fixtures/make-legacy.mjs). */
const fixture = (name: string) => readFileSync(resolve(__dirname, '../../../docs/legacy', name), 'utf8');

describe('legacy fixtures written by the previous app', () => {
  // The minimal backup of the previous app drops tables on purpose (its own fallback), so no table split there.
  it.each([
    ['fixture-storage.json', 'storage', 1],
    ['fixture-export-full.json', 'file-full', 1],
    ['fixture-export-box.json', 'file-box', 1],
    ['fixture-minimal-backup.json', 'minimal-backup', 0],
  ] as const)('%s is detected as %s and yields a complete plan', async (file, source, tables) => {
    const parsed = parseLegacy(fixture(file));
    expect(parsed.source).toBe(source);
    expect(parsed.boxes.length).toBeGreaterThan(0);
    const plan = await planLegacyImport(parsed, { skipSamples: false });
    expect(plan.counts.boxes).toBe(parsed.boxes.length);
    expect(plan.tabs.length).toBe(parsed.tabs.length);
    // every legacy card becomes at least one card; the custom table becomes an extra Table Card
    expect(plan.cards.length).toBe(parsed.cards.length + plan.counts.tablesSplit);
    expect(plan.counts.tablesSplit).toBe(tables);
    // the sample "Welcome" card from the previous app is detected when skipSamples is on
    const skipped = await planLegacyImport(parsed, { skipSamples: true });
    expect(skipped.counts.sampleSkipped).toBeGreaterThanOrEqual(1);
  });

  it('keeps the formula footer of the migrated table and the copy count of the original card', async () => {
    const parsed = parseLegacy(fixture('fixture-storage.json'));
    const plan = await planLegacyImport(parsed, { skipSamples: false });
    const table = plan.cards.find((c) => c.type === 'table');
    expect(table).toBeDefined();
    const body = table!.body as TableBody;
    expect(body.rows).toHaveLength(2);
    const hours = body.columns.find((c) => c.name === 'Hours')!;
    expect(body.footer[hours.id]).toBe('sum//all');
    // same output as the previous app: sums are printed with two decimals
    expect(evaluateFormula(body.footer[hours.id]!, body.rows.map((r) => r.cells[hours.id] ?? ''))).toBe('14.50');
    const original = plan.cards.find((c) => c.title === 'Weekly hours' && c.type === 'text');
    expect(original?.stats.copyCount).toBe(3);
    expect(original?.tags).toEqual(['time']);

    await applyLegacyPlan(plan, { kind: 'legacy-file', source: 'fixture-storage.json' });
    const boxes = await listBoxes();
    expect(boxes).toHaveLength(1);
    const cards = await listCards(boxes[0]!.id);
    expect(cards).toHaveLength(plan.cards.length);
    const template = cards.find((c) => c.title === 'Invoice line');
    expect(template && 'md' in template.body ? template.body.md : '').toContain('{{number}}');
  });
});
