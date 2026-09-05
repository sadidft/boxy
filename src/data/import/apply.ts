import * as Y from 'yjs';
import { getDB } from '../db';
import { newId } from '../ids';
import { flushProjections, withBox } from '../store';
import { bodyToY } from '../codec';
import { saveSettings } from '../repo/settings';
import type { LegacyPlan } from './legacy';
import type { Card, MigrationLog, Tab } from '../types';

export interface ApplyResult {
  log: MigrationLog;
}

/**
 * Writes a legacy plan into the store. Idempotent: entities are keyed by deterministic ids,
 * so applying the same plan twice updates instead of duplicating.
 */
export async function applyLegacyPlan(plan: LegacyPlan, meta: { kind: MigrationLog['kind']; source: string; backupFile?: string }): Promise<ApplyResult> {
  const db = getDB();
  const tabsByBox = groupBy(plan.tabs, (t) => t.boxId);
  const cardsByBox = groupBy(plan.cards, (c) => c.boxId);

  for (const box of plan.boxes) {
    await withBox(box.id, (doc) => {
      const bm = doc.getMap('box');
      const created = bm.get('createdAt');
      bm.set('id', box.id);
      bm.set('name', box.name);
      bm.set('icon', box.icon);
      if (!bm.get('color')) bm.set('color', box.color);
      if (!bm.get('order')) bm.set('order', box.order);
      bm.set('archived', Boolean(bm.get('archived')));
      bm.set('sync', 'local');
      if (!created) bm.set('createdAt', box.createdAt);
      bm.set('updatedAt', Math.max(Number(bm.get('updatedAt') ?? 0), box.updatedAt));
      writeTabs(doc, tabsByBox.get(box.id) ?? []);
      writeCards(doc, cardsByBox.get(box.id) ?? []);
    });
    await flushProjections(box.id);
  }

  if (plan.settings.theme || plan.settings.accentCustom) {
    await saveSettings({
      ...(plan.settings.theme ? { theme: plan.settings.theme } : {}),
      ...(plan.settings.accentCustom ? { accent: 'custom', accentCustom: plan.settings.accentCustom } : {}),
    });
  }

  const log: MigrationLog = {
    id: newId(),
    at: Date.now(),
    kind: meta.kind,
    source: meta.source,
    counts: { ...plan.counts },
    warnings: plan.warnings,
    backupFile: meta.backupFile,
  };
  await db.migrations.put(log);
  return { log };
}

function writeTabs(doc: Y.Doc, tabs: Tab[]) {
  const tabsY = doc.getMap('tabs') as Y.Map<Y.Map<unknown>>;
  for (const t of tabs) {
    const existing = tabsY.get(t.id);
    const tm = existing ?? new Y.Map<unknown>();
    tm.set('id', t.id);
    tm.set('name', t.name);
    tm.set('icon', t.icon);
    tm.set('pinned', t.pinned);
    if (!existing) tm.set('order', t.order);
    tm.set('kind', t.kind);
    if (t.smartQuery) tm.set('smartQuery', t.smartQuery);
    if (!existing) tm.set('createdAt', t.createdAt);
    tm.set('updatedAt', t.updatedAt);
    if (!existing) tabsY.set(t.id, tm);
  }
}

function writeCards(doc: Y.Doc, cards: Card[]) {
  const cardsY = doc.getMap('cards') as Y.Map<Y.Map<unknown>>;
  for (const c of cards) {
    const existing = cardsY.get(c.id);
    if (existing && Number(existing.get('updatedAt') ?? 0) >= c.updatedAt) continue; // local edits win
    const cm = existing ?? new Y.Map<unknown>();
    cm.set('id', c.id);
    cm.set('tabId', c.tabId);
    cm.set('type', c.type);
    cm.set('title', c.title);
    cm.set('body', bodyToY(c.type, c.body));
    const tags = new Y.Array<string>();
    tags.push(c.tags);
    cm.set('tags', tags);
    if (c.label) cm.set('label', c.label);
    cm.set('pinned', c.pinned);
    if (!existing) cm.set('order', c.order);
    if (c.quickSlot) cm.set('quickSlot', c.quickSlot);
    if (!existing) cm.set('vars', new Y.Map());
    const stats = new Y.Map<unknown>();
    stats.set('copyCount', c.stats.copyCount);
    if (c.stats.lastCopiedAt) stats.set('lastCopiedAt', c.stats.lastCopiedAt);
    stats.set('openCount', c.stats.openCount);
    cm.set('stats', stats);
    cm.set('rev', c.rev);
    if (!existing) cm.set('createdAt', c.createdAt);
    cm.set('updatedAt', c.updatedAt);
    if (!existing) cardsY.set(c.id, cm);
  }
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const list = m.get(k) ?? [];
    list.push(it);
    m.set(k, list);
  }
  return m;
}
