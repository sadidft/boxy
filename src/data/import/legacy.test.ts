import { describe, expect, it } from 'vitest';
import { parseLegacy, planLegacyImport, LegacyParseError, tableToMarkdown } from './legacy';
import { applyLegacyPlan } from './apply';
import { listBoxes } from '../repo/boxes';
import { listTabs } from '../repo/tabs';
import { listCards } from '../repo/cards';
import type { TableBody } from '../types';

const T0 = 1_700_000_000_000;
const legacyFull = () => ({
  _meta: { app: 'Boxy', version: '1.0.23', exportedAt: new Date(T0).toISOString(), type: 'full' },
  // guardrail-exception: fixture value written by the previous app
  settings: { theme: 'dark', primaryColor: '#ff0000' },
  boxes: [
    { id: 'box_a', name: 'Personal', icon: 'boxy', order: 1, createdAt: T0, updatedAt: T0 },
    { id: 'box_b', name: 'Work', icon: 'briefcase', order: 0, createdAt: T0 + 1, updatedAt: T0 + 1 },
  ],
  tabs: [
    { id: 'tab_1', boxId: 'box_b', name: 'Email', icon: 'mail', pinned: true, order: 0, createdAt: T0, updatedAt: T0 },
    { id: 'tab_2', boxId: 'box_a', name: 'Notes', icon: 'pizza-slice', pinned: false, order: 0, createdAt: T0, updatedAt: T0 },
    { id: 'tab_orphan', boxId: 'box_missing', name: 'Lost', icon: 'folder', pinned: false, order: 0, createdAt: T0, updatedAt: T0 },
  ],
  cards: [
    {
      id: 'card_1',
      tabId: 'tab_1',
      title: 'Signature',
      content: 'Regards,\n{{name}}',
      tags: ['Mail', 'mail', ''],
      pinned: true,
      copyCount: 7,
      order: 1,
      createdAt: T0,
      updatedAt: T0 + 5,
      history: [{ timestamp: T0 + 2, action: 'copied' }, { timestamp: T0 + 9, action: 'edited' }],
      table: null,
    },
    {
      id: 'card_2',
      tabId: 'tab_1',
      title: 'Hours',
      content: 'Weekly hours',
      tags: [],
      pinned: false,
      copyCount: 0,
      order: 0,
      createdAt: T0,
      updatedAt: T0,
      history: [],
      table: {
        mode: 'custom',
        columns: [
          { id: 'c_day', name: 'Day', order: 0 },
          { id: 'c_h', name: 'Hours', order: 1 },
        ],
        rows: [
          { id: 'r1', cells: { c_day: 'Mon', c_h: '8' }, order: 0 },
          { id: 'r2', cells: { c_day: 'Tue', c_h: '6.5' }, order: 1 },
          { id: 'r3', cells: { c_day: '', c_h: 'sum//all' }, order: 2 },
        ],
      },
    },
    {
      id: 'card_3',
      tabId: 'tab_1',
      title: 'Log',
      content: 'copy log',
      tags: [],
      pinned: false,
      copyCount: 0,
      order: 2,
      createdAt: T0,
      updatedAt: T0,
      history: [],
      table: { mode: 'history', columns: [], rows: [] },
    },
    { id: 'card_orphan', tabId: 'tab_gone', title: 'Orphan', content: 'x', tags: [], pinned: false, copyCount: 0, order: 0, createdAt: T0, updatedAt: T0, history: [], table: null },
    { id: 'card_sample', tabId: 'tab_2', title: 'Welcome to Boxy! \u{1F389}', content: '# Getting Started\nBoxy is an offline clipboard manager', tags: [], pinned: false, copyCount: 0, order: 0, createdAt: T0, updatedAt: T0, history: [], table: null },
    { broken: true },
  ],
});

describe('legacy import', () => {
  it('parses the four legacy shapes', () => {
    const full = parseLegacy(JSON.stringify(legacyFull()));
    expect(full.source).toBe('file-full');
    expect(full.boxes).toHaveLength(2);
    expect(full.cards).toHaveLength(5);
    expect(full.warnings[0]).toMatch(/card #6 skipped/);

    const storage = parseLegacy({ _version: '1.0.23', settings: {}, boxes: [], tabs: [], cards: [], allTags: [] });
    expect(storage.source).toBe('storage');
    const minimal = parseLegacy({ boxes: [], tabs: [], cards: [] });
    expect(minimal.source).toBe('minimal-backup');
    const box = parseLegacy({ _meta: { app: 'Boxy', type: 'box' }, box: legacyFull().boxes[0], tabs: [], cards: [] });
    expect(box.source).toBe('file-box');
    expect(() => parseLegacy('nope')).toThrow(LegacyParseError);
    expect(() => parseLegacy({ hello: 1 })).toThrow(LegacyParseError);
    expect(() => parseLegacy({ _meta: { app: 'Other', type: 'full' } })).toThrow(LegacyParseError);
  });

  it('plans a migration with deterministic ids, order, tables, orphans and samples', async () => {
    const plan = await planLegacyImport(parseLegacy(legacyFull()), { now: T0 + 100 });
    const plan2 = await planLegacyImport(parseLegacy(legacyFull()), { now: T0 + 100 });
    expect(plan.boxes.map((b) => b.id)).toEqual(plan2.boxes.map((b) => b.id));
    expect(plan.cards.map((c) => c.id)).toEqual(plan2.cards.map((c) => c.id));

    // order by legacy numeric order: Work (0) before Personal (1); recovered box last
    expect(plan.boxes.map((b) => b.name)).toEqual(['Work', 'Personal', 'Recovered']);
    expect(plan.boxes[1]?.icon).toBe('box');
    expect(plan.tabs.find((t) => t.name === 'Notes')?.icon).toBe('pizza');
    expect(plan.counts).toMatchObject({ boxes: 3, tablesSplit: 1, historyTablesDropped: 1, sampleSkipped: 1 });
    expect(plan.counts.orphansRecovered).toBe(2);

    const sig = plan.cards.find((c) => c.title === 'Signature')!;
    expect(sig.tags).toEqual(['Mail']);
    expect(sig.stats).toMatchObject({ copyCount: 7, lastCopiedAt: T0 + 2 });
    expect(sig.pinned).toBe(true);

    const table = plan.cards.find((c) => c.type === 'table')!;
    expect(table.title).toBe('Hours (table)');
    const body = table.body as TableBody;
    expect(body.columns.map((c) => c.type)).toEqual(['text', 'number']);
    expect(body.rows).toHaveLength(2);
    expect(body.footer).toEqual({ c_h: 'sum//all' });
    const emailCards = plan.cards.filter((c) => c.tabId === plan.tabs.find((t) => t.name === 'Email')!.id);
    const ordered = [...emailCards].sort((a, b) => (a.order < b.order ? -1 : 1)).map((c) => c.title);
    expect(ordered).toEqual(['Hours', 'Hours (table)', 'Signature', 'Log']);
    // guardrail-exception: fixture value written by the previous app
    expect(plan.settings).toEqual({ theme: 'dark', accentCustom: '#ff0000' });

    const inline = await planLegacyImport(parseLegacy(legacyFull()), { now: T0 + 100, tables: 'inline' });
    const hours = inline.cards.find((c) => c.title === 'Hours')!;
    expect((hours.body as { md: string }).md).toContain('| Day | Hours |');
    expect(inline.counts.tablesSplit).toBe(0);
  });

  it('applies the plan idempotently', async () => {
    const plan = await planLegacyImport(parseLegacy(legacyFull()), { now: T0 + 100 });
    await applyLegacyPlan(plan, { kind: 'legacy-file', source: 'test' });
    await applyLegacyPlan(plan, { kind: 'legacy-file', source: 'test' });
    const boxes = await listBoxes();
    expect(boxes.map((b) => b.name)).toEqual(['Work', 'Personal', 'Recovered']);
    const work = boxes[0]!;
    expect(work.cardCount).toBe(4);
    const tabs = await listTabs(work.id);
    expect(tabs[0]).toMatchObject({ name: 'Email', pinned: true });
    const cards = await listCards(work.id);
    expect(cards).toHaveLength(4);
    const recovered = boxes[2]!;
    expect(recovered.cardCount).toBe(1);
    expect((await listTabs(recovered.id)).map((t) => t.name).sort()).toEqual(['Lost', 'Recovered cards']);
  });

  it('renders tables as GFM', () => {
    const md = tableToMarkdown({
      columns: [
        { id: 'a', name: 'A', type: 'text', order: 'a0' },
        { id: 'b', name: 'B', type: 'number', order: 'a1' },
      ],
      rows: [{ id: 'r', cells: { a: 'x|y', b: '1' }, order: 'a0' }],
      footer: { b: 'sum//all' },
    });
    expect(md).toBe('| A | B |\n| --- | --- |\n| x\\|y | 1 |\n|  | sum//all |');
  });
});
