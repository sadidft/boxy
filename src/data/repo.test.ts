import { describe, expect, it } from 'vitest';
import { getDB } from './db';
import { createBox, listBoxes, removeBox, updateBox } from './repo/boxes';
import { createTab, listTabs, removeTab } from './repo/tabs';
import { createCard, getCard, listCards, moveCard, recordCopy, removeCard, updateCard } from './repo/cards';
import { listTrash, purgeExpired, restore, TRASH_RETENTION_MS } from './repo/trash';
import { canUndo, undo, redo } from './repo/undo';
import { buildExport, isBoxyFormat2 } from './export/json';
import { applyBoxyImport, previewBoxyImport } from './import/json';
import { flushProjections } from './store';
import type { TextBody } from './types';

async function seed() {
  const boxId = await createBox({ name: 'Work', icon: 'briefcase', color: 'cyan' });
  const tabId = await createTab(boxId, { name: 'Email' });
  const c1 = await createCard(boxId, tabId, { title: 'Hello', body: { md: 'Hi {{name}}' }, tags: ['Greeting', 'greeting', '#mail'] });
  const c2 = await createCard(boxId, tabId, { title: 'Bye', body: { md: 'Bye' } });
  return { boxId, tabId, c1, c2 };
}

describe('repositories', () => {
  it('creates boxes, tabs and cards and projects them into Dexie', async () => {
    const { boxId, tabId, c1 } = await seed();
    const boxes = await listBoxes();
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toMatchObject({ id: boxId, name: 'Work', cardCount: 2, tabCount: 1 });
    const tabs = await listTabs(boxId);
    expect(tabs.map((t) => t.name)).toEqual(['Email']);
    const card = await getCard(boxId, c1);
    expect(card?.tags).toEqual(['Greeting', 'mail']);
    expect(card?.tabId).toBe(tabId);
    const idx = await getDB().cards_index.get(c1);
    expect(idx).toMatchObject({ title: 'Hello', hasVars: 1, pinned: 0, preview: 'Hi {{name}}' });
  });

  it('updates card text with a minimal diff and tracks copy stats', async () => {
    const { boxId, c1 } = await seed();
    await updateCard(boxId, c1, { body: { md: 'Hi {{name}}, welcome' }, pinned: true, label: 'amber' });
    await recordCopy(boxId, c1);
    const card = await getCard(boxId, c1);
    expect((card?.body as TextBody).md).toBe('Hi {{name}}, welcome');
    expect(card?.pinned).toBe(true);
    expect(card?.label).toBe('amber');
    expect(card?.stats.copyCount).toBe(1);
    expect(card?.rev).toBe(1);
    const idx = await getDB().cards_index.get(c1);
    expect(idx?.copyCount).toBe(1);
    expect(idx?.pinned).toBe(1);
  });

  it('orders cards with fractional keys and moves between tabs', async () => {
    const { boxId, tabId, c1, c2 } = await seed();
    const other = await createTab(boxId, { name: 'Other' });
    const cards = await listCards(boxId, tabId);
    const sorted = [...cards].sort((a, b) => (a.order < b.order ? -1 : 1)).map((c) => c.id);
    expect(sorted).toEqual([c1, c2]);
    await moveCard(boxId, c2, tabId, null, c1);
    const again = (await listCards(boxId, tabId)).sort((a, b) => (a.order < b.order ? -1 : 1)).map((c) => c.id);
    expect(again).toEqual([c2, c1]);
    await moveCard(boxId, c1, other, null, null);
    expect((await listCards(boxId, other)).map((c) => c.id)).toEqual([c1]);
    expect(await getDB().cards_index.where('[boxId+tabId]').equals([boxId, other]).count()).toBe(1);
  });

  it('moves cards, tabs and boxes to Trash and restores them', async () => {
    const { boxId, tabId, c1 } = await seed();
    await removeCard(boxId, c1);
    expect(await getCard(boxId, c1)).toBeUndefined();
    let trash = await listTrash();
    expect(trash).toHaveLength(1);
    await restore(trash[0]!.id);
    expect((await getCard(boxId, c1))?.title).toBe('Hello');

    await removeTab(boxId, tabId);
    expect(await listTabs(boxId)).toHaveLength(0);
    expect(await listCards(boxId)).toHaveLength(0);
    trash = await listTrash();
    await restore(trash[0]!.id);
    expect(await listTabs(boxId)).toHaveLength(1);
    expect(await listCards(boxId)).toHaveLength(2);

    await removeBox(boxId);
    expect(await listBoxes()).toHaveLength(0);
    expect(await getDB().cards_index.count()).toBe(0);
    trash = await listTrash();
    expect(trash[0]).toMatchObject({ entity: 'box', label: 'Work' });
    await restore(trash[0]!.id);
    const boxes = await listBoxes();
    expect(boxes[0]).toMatchObject({ id: boxId, name: 'Work', cardCount: 2 });
    expect(await listTrash()).toHaveLength(0);
  });

  it('purges Trash after 30 days', async () => {
    const { boxId, c1 } = await seed();
    await removeCard(boxId, c1);
    expect(await purgeExpired(Date.now())).toBe(0);
    expect(await purgeExpired(Date.now() + TRASH_RETENTION_MS + 1000)).toBe(1);
    expect(await listTrash()).toHaveLength(0);
  });

  it('supports undo and redo of local edits', async () => {
    const { boxId, c1 } = await seed();
    await new Promise((r) => setTimeout(r, 450));
    await updateBox(boxId, { name: 'Work renamed' });
    await updateCard(boxId, c1, { title: 'Changed' });
    expect(canUndo(boxId)).toBe(true);
    expect(await undo(boxId)).toBe(true);
    expect((await getCard(boxId, c1))?.title).toBe('Hello');
    expect((await listBoxes())[0]?.name).toBe('Work');
    expect(await redo(boxId)).toBe(true);
    expect((await getCard(boxId, c1))?.title).toBe('Changed');
  });

  it('round-trips through export format 2', async () => {
    const { boxId, c1 } = await seed();
    await updateCard(boxId, c1, { label: 'pink' });
    await flushProjections();
    const exp = await buildExport('full');
    expect(exp._meta).toMatchObject({ app: 'Boxy', format: 2, kind: 'full' });
    expect(exp._meta.sha256).toHaveLength(64);
    expect(isBoxyFormat2(JSON.parse(JSON.stringify(exp)))).toBe(true);
    const preview = await previewBoxyImport(JSON.parse(JSON.stringify(exp)));
    expect(preview).toMatchObject({ counts: { boxes: 1, tabs: 1, cards: 2 }, checksumOk: true });

    await removeBox(boxId);
    expect(await listBoxes()).toHaveLength(0);
    const log = await applyBoxyImport(JSON.parse(JSON.stringify(exp)), 'merge', 'test.json');
    expect(log.counts).toMatchObject({ boxes: 1, cards: 2, added: 2 });
    const boxes = await listBoxes();
    expect(boxes[0]).toMatchObject({ id: boxId, name: 'Work', cardCount: 2 });
    expect((await getCard(boxId, c1))?.label).toBe('pink');
    // Importing again is idempotent.
    const log2 = await applyBoxyImport(JSON.parse(JSON.stringify(exp)), 'merge', 'test.json');
    expect(log2.counts.added).toBe(0);
    expect((await listBoxes())[0]?.cardCount).toBe(2);
  });
});
