import * as Y from 'yjs';
import { z } from 'zod';
import { getDB } from '../db';
import { newId } from '../ids';
import { keyAfterAll, keyBetween } from '../order';
import { acquireBox, flushProjections, releaseBox, withBox } from '../store';
import { destroyDocStorage, snapshotDoc } from '../ydoc';
import { BoxyError, type BoxColor, type BoxId, type BoxMeta } from '../types';
import { labelColors } from '@/styles/tokens';

const colorSchema = z.union([z.enum(labelColors), z.string().regex(/^#[0-9a-fA-F]{6}$/)]);

export const newBoxSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().min(1).max(64).default('box'),
  color: colorSchema.default('mint'),
  id: z.string().optional(),
  createdAt: z.number().optional(),
  order: z.string().optional(),
});
export type NewBox = z.input<typeof newBoxSchema>;

export const boxPatchSchema = newBoxSchema.pick({ name: true, icon: true, color: true }).partial().extend({
  archived: z.boolean().optional(),
});
export type BoxPatch = z.input<typeof boxPatchSchema>;

export async function listBoxes(): Promise<BoxMeta[]> {
  return getDB().boxes.orderBy('order').toArray();
}

export async function createBox(input: NewBox): Promise<BoxId> {
  const parsed = newBoxSchema.parse(input);
  const db = getDB();
  const now = parsed.createdAt ?? Date.now();
  const id = parsed.id ?? newId(now);
  const existing = await db.boxes.orderBy('order').keys();
  const order = parsed.order ?? keyAfterAll(existing as string[]);
  await withBox(id, (doc) => {
    const bm = doc.getMap('box');
    bm.set('id', id);
    bm.set('name', parsed.name);
    bm.set('icon', parsed.icon);
    bm.set('color', parsed.color as BoxColor);
    bm.set('order', order);
    bm.set('archived', false);
    bm.set('sync', 'local');
    bm.set('createdAt', now);
    bm.set('updatedAt', now);
  });
  await flushProjections(id);
  return id;
}

export async function updateBox(id: BoxId, patch: BoxPatch): Promise<void> {
  const parsed = boxPatchSchema.parse(patch);
  await withBox(id, (doc) => {
    const bm = doc.getMap('box');
    if (!bm.get('id')) throw new BoxyError('NotFound', `Box ${id} not found`);
    for (const [k, v] of Object.entries(parsed)) if (v !== undefined) bm.set(k, v);
    bm.set('updatedAt', Date.now());
  });
  await flushProjections(id);
}

export async function reorderBox(id: BoxId, afterId: BoxId | null, beforeId: BoxId | null): Promise<void> {
  const db = getDB();
  const after = afterId ? await db.boxes.get(afterId) : undefined;
  const before = beforeId ? await db.boxes.get(beforeId) : undefined;
  const order = keyBetween(after?.order ?? null, before?.order ?? null);
  await withBox(id, (doc) => {
    doc.getMap('box').set('order', order);
    doc.getMap('box').set('updatedAt', Date.now());
  });
  await flushProjections(id);
}

/** Moves the whole box (with tabs and cards) to Trash. The Y.Doc snapshot is stored for restore. */
export async function removeBox(id: BoxId): Promise<string> {
  const db = getDB();
  const meta = await db.boxes.get(id);
  if (!meta) throw new BoxyError('NotFound', `Box ${id} not found`);
  const entry = await acquireBox(id);
  let snapshot: Uint8Array;
  try {
    snapshot = snapshotDoc(entry.doc);
  } finally {
    releaseBox(id);
  }
  const trashId = newId();
  await db.transaction('rw', db.trash, db.boxes, db.cards_index, async () => {
    await db.trash.put({
      id: trashId,
      entity: 'box',
      entityId: id,
      boxId: id,
      label: meta.name,
      deletedAt: Date.now(),
      payload: { snapshot, meta },
    });
    await db.cards_index.where('boxId').equals(id).delete();
    await db.boxes.delete(id);
  });
  await destroyDocStorage(id);
  return trashId;
}

/** Internal: rebuilds a box from a Y update (Trash restore). */
export async function restoreBoxFromSnapshot(id: BoxId, snapshot: Uint8Array): Promise<void> {
  const entry = await acquireBox(id);
  try {
    Y.applyUpdate(entry.doc, snapshot, { by: 'restore' });
  } finally {
    releaseBox(id);
  }
  await flushProjections(id);
}
