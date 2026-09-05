import * as Y from 'yjs';
import { z } from 'zod';
import { getDB } from '../db';
import { newId } from '../ids';
import { keyAfterAll, keyBetween, sortByOrder } from '../order';
import { flushProjections, readBox, withBox } from '../store';
import { tabFromY, cardFromY } from '../codec';
import { BoxyError, type BoxId, type Tab, type TabId } from '../types';

export const newTabSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().min(1).max(64).default('folder'),
  pinned: z.boolean().default(false),
  kind: z.enum(['manual', 'smart']).default('manual'),
  smartQuery: z.string().max(200).optional(),
  id: z.string().optional(),
  createdAt: z.number().optional(),
  order: z.string().optional(),
});
export type NewTab = z.input<typeof newTabSchema>;

export const tabPatchSchema = newTabSchema.pick({ name: true, icon: true, pinned: true, smartQuery: true }).partial();
export type TabPatch = z.input<typeof tabPatchSchema>;

const tabsMap = (doc: Y.Doc) => doc.getMap('tabs') as Y.Map<Y.Map<unknown>>;

export async function listTabs(boxId: BoxId): Promise<Tab[]> {
  return readBox(boxId, (doc) => {
    const out: Tab[] = [];
    tabsMap(doc).forEach((tm) => out.push(tabFromY(boxId, tm)));
    const sorted = sortByOrder(out);
    return [...sorted.filter((t) => t.pinned), ...sorted.filter((t) => !t.pinned)];
  });
}

export async function getTab(boxId: BoxId, tabId: TabId): Promise<Tab | undefined> {
  return readBox(boxId, (doc) => {
    const tm = tabsMap(doc).get(tabId);
    return tm ? tabFromY(boxId, tm) : undefined;
  });
}

export async function createTab(boxId: BoxId, input: NewTab): Promise<TabId> {
  const parsed = newTabSchema.parse(input);
  const now = parsed.createdAt ?? Date.now();
  const id = parsed.id ?? newId(now);
  await withBox(boxId, (doc) => {
    const tabs = tabsMap(doc);
    if (!doc.getMap('box').get('id')) throw new BoxyError('NotFound', `Box ${boxId} not found`);
    const keys: string[] = [];
    tabs.forEach((tm) => keys.push(String(tm.get('order') ?? '')));
    const tm = new Y.Map<unknown>();
    tm.set('id', id);
    tm.set('name', parsed.name);
    tm.set('icon', parsed.icon);
    tm.set('pinned', parsed.pinned);
    tm.set('order', parsed.order ?? keyAfterAll(keys));
    tm.set('kind', parsed.kind);
    if (parsed.smartQuery) tm.set('smartQuery', parsed.smartQuery);
    tm.set('createdAt', now);
    tm.set('updatedAt', now);
    tabs.set(id, tm);
    doc.getMap('box').set('updatedAt', now);
  });
  await flushProjections(boxId);
  return id;
}

export async function updateTab(boxId: BoxId, tabId: TabId, patch: TabPatch): Promise<void> {
  const parsed = tabPatchSchema.parse(patch);
  await withBox(boxId, (doc) => {
    const tm = tabsMap(doc).get(tabId);
    if (!tm) throw new BoxyError('NotFound', `Tab ${tabId} not found`);
    for (const [k, v] of Object.entries(parsed)) if (v !== undefined) tm.set(k, v);
    tm.set('updatedAt', Date.now());
  });
}

export async function reorderTab(boxId: BoxId, tabId: TabId, afterId: TabId | null, beforeId: TabId | null): Promise<void> {
  await withBox(boxId, (doc) => {
    const tabs = tabsMap(doc);
    const tm = tabs.get(tabId);
    if (!tm) throw new BoxyError('NotFound', `Tab ${tabId} not found`);
    const a = afterId ? (tabs.get(afterId)?.get('order') as string | undefined) : undefined;
    const b = beforeId ? (tabs.get(beforeId)?.get('order') as string | undefined) : undefined;
    tm.set('order', keyBetween(a ?? null, b ?? null));
    tm.set('updatedAt', Date.now());
  });
}

/** Moves a tab and its cards to Trash in one transaction. */
export async function removeTab(boxId: BoxId, tabId: TabId): Promise<string> {
  const db = getDB();
  const trashId = newId();
  const snapshot = await withBox(boxId, (doc) => {
    const tabs = tabsMap(doc);
    const tm = tabs.get(tabId);
    if (!tm) throw new BoxyError('NotFound', `Tab ${tabId} not found`);
    const tab = tabFromY(boxId, tm);
    const cards = doc.getMap('cards') as Y.Map<Y.Map<unknown>>;
    const removedCards = [] as ReturnType<typeof cardFromY>[];
    cards.forEach((cm, id) => {
      if (cm.get('tabId') === tabId) {
        removedCards.push(cardFromY(boxId, cm));
        cards.delete(id);
      }
    });
    tabs.delete(tabId);
    doc.getMap('box').set('updatedAt', Date.now());
    return { tab, cards: removedCards };
  });
  await db.trash.put({
    id: trashId,
    entity: 'tab',
    entityId: tabId,
    boxId,
    label: snapshot.tab.name,
    deletedAt: Date.now(),
    payload: snapshot,
  });
  await flushProjections(boxId);
  return trashId;
}
