import * as Y from 'yjs';
import { z } from 'zod';
import { getDB } from '../db';
import { newId } from '../ids';
import { keyAfterAll, keyBetween } from '../order';
import { flushProjections, readBox, withBox } from '../store';
import { bodyToY, cardFromY } from '../codec';
import { labelColors } from '@/styles/tokens';
import { BoxyError, type BoxId, type Card, type CardBody, type CardId, type CardType, type TabId, type TableBody, type TextBody } from '../types';

export const tableBodySchema = z.object({
  columns: z.array(z.object({ id: z.string(), name: z.string(), type: z.enum(['text', 'number', 'date', 'time', 'formula']).default('text'), order: z.string(), width: z.number().optional() })),
  rows: z.array(z.object({ id: z.string(), cells: z.record(z.string(), z.string()), order: z.string() })),
  footer: z.record(z.string(), z.string()).default({}),
});

export const newCardSchema = z.object({
  type: z.enum(['text', 'table']).default('text'),
  title: z.string().trim().max(200).default(''),
  body: z.union([z.object({ md: z.string() }), tableBodySchema]).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(100).default([]),
  label: z.enum(labelColors).optional(),
  pinned: z.boolean().default(false),
  quickSlot: z.number().int().min(1).max(9).optional(),
  id: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  order: z.string().optional(),
  stats: z.object({ copyCount: z.number().default(0), lastCopiedAt: z.number().optional(), openCount: z.number().default(0) }).optional(),
});
export type NewCard = z.input<typeof newCardSchema>;

export const cardPatchSchema = z.object({
  title: z.string().trim().max(200).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(100).optional(),
  label: z.enum(labelColors).nullable().optional(),
  pinned: z.boolean().optional(),
  quickSlot: z.number().int().min(1).max(9).nullable().optional(),
  body: z.union([z.object({ md: z.string() }), tableBodySchema]).optional(),
});
export type CardPatch = z.input<typeof cardPatchSchema>;

const cardsMap = (doc: Y.Doc) => doc.getMap('cards') as Y.Map<Y.Map<unknown>>;

export function normaliseTags(tags: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of tags) {
    const t = raw.trim().replace(/^#/, '');
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()];
}

export async function getCard(boxId: BoxId, cardId: CardId): Promise<Card | undefined> {
  return readBox(boxId, (doc) => {
    const cm = cardsMap(doc).get(cardId);
    return cm ? cardFromY(boxId, cm) : undefined;
  });
}

export async function listCards(boxId: BoxId, tabId?: TabId): Promise<Card[]> {
  return readBox(boxId, (doc) => {
    const out: Card[] = [];
    cardsMap(doc).forEach((cm) => {
      if (!tabId || cm.get('tabId') === tabId) out.push(cardFromY(boxId, cm));
    });
    return out;
  });
}

export async function createCard(boxId: BoxId, tabId: TabId, input: NewCard): Promise<CardId> {
  const parsed = newCardSchema.parse(input);
  const now = parsed.createdAt ?? Date.now();
  const id = parsed.id ?? newId(now);
  const type: CardType = parsed.type;
  const body: CardBody = parsed.body ?? (type === 'table' ? { columns: [], rows: [], footer: {} } : { md: '' });
  await withBox(boxId, (doc) => {
    if (!doc.getMap('tabs').has(tabId)) throw new BoxyError('NotFound', `Tab ${tabId} not found`);
    const cards = cardsMap(doc);
    const keys: string[] = [];
    cards.forEach((cm) => {
      if (cm.get('tabId') === tabId) keys.push(String(cm.get('order') ?? ''));
    });
    const cm = new Y.Map<unknown>();
    cm.set('id', id);
    cm.set('tabId', tabId);
    cm.set('type', type);
    cm.set('title', parsed.title);
    cm.set('body', bodyToY(type, body));
    const tags = new Y.Array<string>();
    tags.push(normaliseTags(parsed.tags));
    cm.set('tags', tags);
    if (parsed.label) cm.set('label', parsed.label);
    cm.set('pinned', parsed.pinned);
    cm.set('order', parsed.order ?? keyAfterAll(keys));
    if (parsed.quickSlot) cm.set('quickSlot', parsed.quickSlot);
    cm.set('vars', new Y.Map());
    const stats = new Y.Map<unknown>();
    stats.set('copyCount', parsed.stats?.copyCount ?? 0);
    if (parsed.stats?.lastCopiedAt) stats.set('lastCopiedAt', parsed.stats.lastCopiedAt);
    stats.set('openCount', parsed.stats?.openCount ?? 0);
    cm.set('stats', stats);
    cm.set('rev', 0);
    cm.set('createdAt', now);
    cm.set('updatedAt', parsed.updatedAt ?? now);
    cards.set(id, cm);
    doc.getMap('box').set('updatedAt', now);
  });
  await flushProjections(boxId);
  return id;
}

export async function updateCard(boxId: BoxId, cardId: CardId, patch: CardPatch): Promise<void> {
  const parsed = cardPatchSchema.parse(patch);
  await withBox(boxId, (doc) => {
    const cm = cardsMap(doc).get(cardId);
    if (!cm) throw new BoxyError('NotFound', `Card ${cardId} not found`);
    if (parsed.title !== undefined) cm.set('title', parsed.title);
    if (parsed.tags !== undefined) {
      const tags = new Y.Array<string>();
      tags.push(normaliseTags(parsed.tags));
      cm.set('tags', tags);
    }
    if (parsed.label !== undefined) {
      if (parsed.label === null) cm.delete('label');
      else cm.set('label', parsed.label);
    }
    if (parsed.pinned !== undefined) cm.set('pinned', parsed.pinned);
    if (parsed.quickSlot !== undefined) {
      if (parsed.quickSlot === null) cm.delete('quickSlot');
      else cm.set('quickSlot', parsed.quickSlot);
    }
    if (parsed.body !== undefined) {
      const type = (cm.get('type') as CardType) ?? 'text';
      if (type === 'text' && 'md' in parsed.body) {
        setText(cm, (parsed.body as TextBody).md);
      } else {
        cm.set('body', bodyToY(type, parsed.body as TableBody));
      }
      cm.set('rev', Number(cm.get('rev') ?? 0) + 1);
    }
    cm.set('updatedAt', Date.now());
  });
}

/** Replaces the markdown body with a minimal diff so Y.Text history stays small and undo stays granular. */
function setText(cm: Y.Map<unknown>, next: string): void {
  const body = cm.get('body') as Y.Map<unknown> | undefined;
  const existing = body?.get('md');
  if (!(body && existing instanceof Y.Text)) {
    cm.set('body', bodyToY('text', { md: next }));
    return;
  }
  const prev = existing.toString();
  if (prev === next) return;
  let start = 0;
  while (start < prev.length && start < next.length && prev[start] === next[start]) start += 1;
  let endPrev = prev.length;
  let endNext = next.length;
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev -= 1;
    endNext -= 1;
  }
  if (endPrev > start) existing.delete(start, endPrev - start);
  if (endNext > start) existing.insert(start, next.slice(start, endNext));
}

export async function moveCard(boxId: BoxId, cardId: CardId, toTabId: TabId, afterId: CardId | null, beforeId: CardId | null): Promise<void> {
  await withBox(boxId, (doc) => {
    const cards = cardsMap(doc);
    const cm = cards.get(cardId);
    if (!cm) throw new BoxyError('NotFound', `Card ${cardId} not found`);
    if (!doc.getMap('tabs').has(toTabId)) throw new BoxyError('NotFound', `Tab ${toTabId} not found`);
    const a = afterId ? (cards.get(afterId)?.get('order') as string | undefined) : undefined;
    const b = beforeId ? (cards.get(beforeId)?.get('order') as string | undefined) : undefined;
    cm.set('tabId', toTabId);
    cm.set('order', keyBetween(a ?? null, b ?? null));
    cm.set('updatedAt', Date.now());
  });
}

export async function recordCopy(boxId: BoxId, cardId: CardId): Promise<void> {
  await withBox(boxId, (doc) => {
    const cm = cardsMap(doc).get(cardId);
    if (!cm) return;
    const stats = cm.get('stats') as Y.Map<unknown>;
    stats.set('copyCount', Number(stats.get('copyCount') ?? 0) + 1);
    stats.set('lastCopiedAt', Date.now());
  });
}

export async function rememberVar(boxId: BoxId, cardId: CardId, name: string, value: string): Promise<void> {
  await withBox(boxId, (doc) => {
    const cm = cardsMap(doc).get(cardId);
    if (!cm) return;
    const vars = cm.get('vars') as Y.Map<unknown>;
    const prev = (vars.get(name) as { last: string; history: string[] } | undefined) ?? { last: '', history: [] };
    const history = [value, ...prev.history.filter((h) => h !== value)].slice(0, 5);
    vars.set(name, { last: value, history });
  });
}

export async function removeCard(boxId: BoxId, cardId: CardId): Promise<string> {
  const db = getDB();
  const trashId = newId();
  const snapshot = await withBox(boxId, (doc) => {
    const cards = cardsMap(doc);
    const cm = cards.get(cardId);
    if (!cm) throw new BoxyError('NotFound', `Card ${cardId} not found`);
    const card = cardFromY(boxId, cm);
    cards.delete(cardId);
    doc.getMap('box').set('updatedAt', Date.now());
    return card;
  });
  await db.trash.put({
    id: trashId,
    entity: 'card',
    entityId: cardId,
    boxId,
    label: snapshot.title || snapshot.type,
    deletedAt: Date.now(),
    payload: snapshot,
  });
  await flushProjections(boxId);
  return trashId;
}

/** Re-inserts a plain Card object (Trash restore, import). Keeps id, order and timestamps. */
export async function insertCardRaw(boxId: BoxId, card: Card): Promise<void> {
  await withBox(boxId, (doc) => {
    const cards = cardsMap(doc);
    const cm = new Y.Map<unknown>();
    cm.set('id', card.id);
    cm.set('tabId', card.tabId);
    cm.set('type', card.type);
    cm.set('title', card.title);
    cm.set('body', bodyToY(card.type, card.body));
    const tags = new Y.Array<string>();
    tags.push(card.tags);
    cm.set('tags', tags);
    if (card.label) cm.set('label', card.label);
    cm.set('pinned', card.pinned);
    cm.set('order', card.order);
    if (card.quickSlot) cm.set('quickSlot', card.quickSlot);
    const vars = new Y.Map<unknown>();
    for (const [k, v] of Object.entries(card.vars ?? {})) vars.set(k, v);
    cm.set('vars', vars);
    const stats = new Y.Map<unknown>();
    stats.set('copyCount', card.stats.copyCount);
    if (card.stats.lastCopiedAt) stats.set('lastCopiedAt', card.stats.lastCopiedAt);
    stats.set('openCount', card.stats.openCount);
    cm.set('stats', stats);
    cm.set('rev', card.rev);
    cm.set('createdAt', card.createdAt);
    cm.set('updatedAt', card.updatedAt);
    cards.set(card.id, cm);
  });
  await flushProjections(boxId);
}
