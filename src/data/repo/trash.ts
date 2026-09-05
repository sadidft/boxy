import * as Y from 'yjs';
import { getDB } from '../db';
import { flushProjections, withBox } from '../store';
import { restoreBoxFromSnapshot } from './boxes';
import { insertCardRaw } from './cards';
import type { BoxMeta, Card, Tab, TrashItem } from '../types';
import { BoxyError } from '../types';

export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export async function listTrash(): Promise<TrashItem[]> {
  return getDB().trash.orderBy('deletedAt').reverse().toArray();
}

export async function purgeExpired(now = Date.now()): Promise<number> {
  const db = getDB();
  const expired = await db.trash.where('deletedAt').below(now - TRASH_RETENTION_MS).primaryKeys();
  if (expired.length) await db.trash.bulkDelete(expired);
  return expired.length;
}

export async function purge(trashId: string): Promise<void> {
  await getDB().trash.delete(trashId);
}

export async function restore(trashId: string): Promise<void> {
  const db = getDB();
  const item = await db.trash.get(trashId);
  if (!item) throw new BoxyError('NotFound', `Trash item ${trashId} not found`);

  if (item.entity === 'box') {
    const { snapshot } = item.payload as { snapshot: Uint8Array; meta: BoxMeta };
    await restoreBoxFromSnapshot(item.boxId, snapshot);
  } else if (item.entity === 'tab') {
    const { tab, cards } = item.payload as { tab: Tab; cards: Card[] };
    const boxExists = await db.boxes.get(item.boxId);
    if (!boxExists) throw new BoxyError('Conflict', 'The box of this tab is no longer available. Restore the box first.');
    await withBox(item.boxId, (doc) => {
      const tabs = doc.getMap('tabs') as Y.Map<Y.Map<unknown>>;
      const tm = new Y.Map<unknown>();
      tm.set('id', tab.id);
      tm.set('name', tab.name);
      tm.set('icon', tab.icon);
      tm.set('pinned', tab.pinned);
      tm.set('order', tab.order);
      tm.set('kind', tab.kind);
      if (tab.smartQuery) tm.set('smartQuery', tab.smartQuery);
      tm.set('createdAt', tab.createdAt);
      tm.set('updatedAt', Date.now());
      tabs.set(tab.id, tm);
    });
    for (const card of cards) await insertCardRaw(item.boxId, card);
    await flushProjections(item.boxId);
  } else {
    const card = item.payload as Card;
    const boxExists = await db.boxes.get(item.boxId);
    if (!boxExists) throw new BoxyError('Conflict', 'The box of this card is no longer available. Restore the box first.');
    const tabExists = await withBox(item.boxId, (doc) => doc.getMap('tabs').has(card.tabId));
    if (!tabExists) throw new BoxyError('Conflict', 'The tab of this card is no longer available. Restore the tab first.');
    await insertCardRaw(item.boxId, card);
  }
  await db.trash.delete(trashId);
}
