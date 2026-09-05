import * as Y from 'yjs';
import { getDB } from '../db';
import { newId } from '../ids';
import { flushProjections, withBox } from '../store';
import { bodyToY } from '../codec';
import { canonical, isBoxyFormat2, sha256, type BoxyExport } from '../export/json';
import { destroyDocStorage } from '../ydoc';
import { listBoxes } from '../repo/boxes';
import type { Card, MigrationLog, Tab } from '../types';

export interface ImportPreview {
  format: 'boxy-2';
  counts: { boxes: number; tabs: number; cards: number };
  checksumOk: boolean | null;
  warnings: string[];
}

export async function previewBoxyImport(data: unknown): Promise<ImportPreview | null> {
  if (!isBoxyFormat2(data)) return null;
  const exp = data as BoxyExport;
  const warnings: string[] = [];
  let checksumOk: boolean | null = null;
  if (exp._meta.sha256) {
    const actual = await sha256(canonical(exp));
    checksumOk = actual === exp._meta.sha256;
    if (!checksumOk) warnings.push('The file checksum does not match. The file may have been edited after export.');
  }
  return { format: 'boxy-2', counts: { boxes: exp.boxes.length, tabs: exp.tabs.length, cards: exp.cards.length }, checksumOk, warnings };
}

/**
 * mode "merge": entities with the same id are updated when the file copy is newer; new ones are added.
 * mode "replace": all current boxes are removed (caller must back up first) and the file is written.
 */
export async function applyBoxyImport(exp: BoxyExport, mode: 'merge' | 'replace', source: string): Promise<MigrationLog> {
  const db = getDB();
  if (mode === 'replace') {
    const current = await listBoxes();
    for (const b of current) {
      await db.cards_index.where('boxId').equals(b.id).delete();
      await db.boxes.delete(b.id);
      await destroyDocStorage(b.id);
    }
  }
  const tabsByBox = new Map<string, Tab[]>();
  for (const t of exp.tabs as Tab[]) tabsByBox.set(t.boxId, [...(tabsByBox.get(t.boxId) ?? []), t]);
  const cardsByBox = new Map<string, Card[]>();
  for (const c of exp.cards as Card[]) cardsByBox.set(c.boxId, [...(cardsByBox.get(c.boxId) ?? []), c]);

  let added = 0;
  let updated = 0;
  for (const b of exp.boxes) {
    await withBox(b.id, (doc) => {
      const bm = doc.getMap('box');
      const exists = Boolean(bm.get('id'));
      const newer = !exists || Number(bm.get('updatedAt') ?? 0) < (b.updatedAt ?? 0);
      if (newer) {
        bm.set('id', b.id);
        bm.set('name', b.name);
        bm.set('icon', b.icon);
        bm.set('color', b.color);
        if (!exists) bm.set('order', b.order);
        bm.set('archived', Boolean(b.archived));
        bm.set('sync', 'local');
        if (!exists) bm.set('createdAt', b.createdAt);
        bm.set('updatedAt', b.updatedAt);
      }
      const tabsY = doc.getMap('tabs') as Y.Map<Y.Map<unknown>>;
      for (const t of tabsByBox.get(b.id) ?? []) {
        const ex = tabsY.get(t.id);
        if (ex && Number(ex.get('updatedAt') ?? 0) >= t.updatedAt) continue;
        const tm = ex ?? new Y.Map<unknown>();
        tm.set('id', t.id);
        tm.set('name', t.name);
        tm.set('icon', t.icon);
        tm.set('pinned', t.pinned);
        if (!ex) tm.set('order', t.order);
        tm.set('kind', t.kind ?? 'manual');
        if (t.smartQuery) tm.set('smartQuery', t.smartQuery);
        if (!ex) tm.set('createdAt', t.createdAt);
        tm.set('updatedAt', t.updatedAt);
        if (!ex) tabsY.set(t.id, tm);
      }
      const cardsY = doc.getMap('cards') as Y.Map<Y.Map<unknown>>;
      for (const c of cardsByBox.get(b.id) ?? []) {
        if (!tabsY.has(c.tabId)) continue;
        const ex = cardsY.get(c.id);
        if (ex && Number(ex.get('updatedAt') ?? 0) >= c.updatedAt) continue;
        const cm = ex ?? new Y.Map<unknown>();
        cm.set('id', c.id);
        cm.set('tabId', c.tabId);
        cm.set('type', c.type);
        cm.set('title', c.title);
        cm.set('body', bodyToY(c.type, c.body));
        const tags = new Y.Array<string>();
        tags.push(c.tags ?? []);
        cm.set('tags', tags);
        if (c.label) cm.set('label', c.label);
        cm.set('pinned', Boolean(c.pinned));
        if (!ex) cm.set('order', c.order);
        if (c.quickSlot) cm.set('quickSlot', c.quickSlot);
        const vars = new Y.Map<unknown>();
        for (const [k, v] of Object.entries(c.vars ?? {})) vars.set(k, v);
        cm.set('vars', vars);
        const stats = new Y.Map<unknown>();
        stats.set('copyCount', c.stats?.copyCount ?? 0);
        if (c.stats?.lastCopiedAt) stats.set('lastCopiedAt', c.stats.lastCopiedAt);
        stats.set('openCount', c.stats?.openCount ?? 0);
        cm.set('stats', stats);
        cm.set('rev', c.rev ?? 0);
        if (!ex) cm.set('createdAt', c.createdAt);
        cm.set('updatedAt', c.updatedAt);
        if (!ex) {
          cardsY.set(c.id, cm);
          added += 1;
        } else updated += 1;
      }
    });
    await flushProjections(b.id);
  }
  for (const g of exp.globals ?? []) await db.globals.put({ key: g.key, value: g.value, updatedAt: Date.now() });
  for (const c of exp.counters ?? []) await db.counters.put({ name: c.name, value: c.value, pad: c.pad, updatedAt: Date.now() });

  const log: MigrationLog = {
    id: newId(),
    at: Date.now(),
    kind: 'json2',
    source,
    counts: { boxes: exp.boxes.length, tabs: exp.tabs.length, cards: exp.cards.length, added, updated },
    warnings: [],
  };
  await db.migrations.put(log);
  return log;
}
