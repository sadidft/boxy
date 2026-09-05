import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { BoxId } from './types';

/**
 * One Y.Doc per box. Layout:
 *   doc.getMap('box')    box meta
 *   doc.getMap('tabs')   Map<tabId, Y.Map>
 *   doc.getMap('cards')  Map<cardId, Y.Map>  (body.md is Y.Text)
 *   doc.getArray('activity')  reserved for Boxy Nearby
 *
 * Docs are reference counted. When the last reference is released the doc lingers for a short
 * while (so quick successive operations do not reload from IndexedDB and undo history survives),
 * then it is destroyed.
 */
export interface OpenDoc {
  boxId: BoxId;
  doc: Y.Doc;
  undo: Y.UndoManager;
  persistence: IndexeddbPersistence | null;
  whenLoaded: Promise<void>;
  refs: number;
  lingerTimer: ReturnType<typeof setTimeout> | null;
}

export const LOCAL_ORIGIN = { by: 'local' } as const;
export const LINGER_MS = 30_000;

const open = new Map<BoxId, OpenDoc>();
const closeListeners = new Set<(boxId: BoxId, doc: Y.Doc) => void>();
const persist = typeof indexedDB !== 'undefined';

export const docName = (boxId: BoxId) => `boxy-ydoc-${boxId}`;

export function openDoc(boxId: BoxId): OpenDoc {
  const existing = open.get(boxId);
  if (existing) {
    existing.refs += 1;
    if (existing.lingerTimer) {
      clearTimeout(existing.lingerTimer);
      existing.lingerTimer = null;
    }
    return existing;
  }
  const doc = new Y.Doc({ guid: boxId, gc: true });
  const scope = [doc.getMap('box'), doc.getMap('tabs'), doc.getMap('cards')];
  const undo = new Y.UndoManager(scope, { trackedOrigins: new Set([LOCAL_ORIGIN]), captureTimeout: 400 });
  const persistence = persist ? new IndexeddbPersistence(docName(boxId), doc) : null;
  const whenLoaded = persistence ? persistence.whenSynced.then(() => undefined) : Promise.resolve();
  const entry: OpenDoc = { boxId, doc, undo, persistence, whenLoaded, refs: 1, lingerTimer: null };
  open.set(boxId, entry);
  return entry;
}

export function releaseDoc(boxId: BoxId): void {
  const entry = open.get(boxId);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs > 0) return;
  if (entry.lingerTimer) clearTimeout(entry.lingerTimer);
  entry.lingerTimer = setTimeout(() => closeNow(boxId), LINGER_MS);
}

function closeNow(boxId: BoxId): void {
  const entry = open.get(boxId);
  if (!entry) return;
  if (entry.lingerTimer) clearTimeout(entry.lingerTimer);
  open.delete(boxId);
  for (const cb of closeListeners) cb(boxId, entry.doc);
  entry.undo.destroy();
  entry.persistence?.destroy();
  entry.doc.destroy();
}

export function peekDoc(boxId: BoxId): OpenDoc | undefined {
  return open.get(boxId);
}

export function onDocClosed(cb: (boxId: BoxId, doc: Y.Doc) => void): () => void {
  closeListeners.add(cb);
  return () => closeListeners.delete(cb);
}

/** Removes the persisted doc entirely (used when a box is moved to Trash; a snapshot is stored there first). */
export async function destroyDocStorage(boxId: BoxId): Promise<void> {
  const entry = open.get(boxId);
  if (entry) {
    if (entry.lingerTimer) clearTimeout(entry.lingerTimer);
    open.delete(boxId);
    for (const cb of closeListeners) cb(boxId, entry.doc);
    entry.undo.destroy();
    if (entry.persistence) await entry.persistence.clearData();
    entry.persistence?.destroy();
    entry.doc.destroy();
  } else if (persist) {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(docName(boxId));
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }
}

/** Closes every open doc immediately (tests, storage reset). */
export function closeAllDocs(): void {
  for (const id of [...open.keys()]) closeNow(id);
}

export function snapshotDoc(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc);
}

export function applySnapshot(doc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(doc, update, { by: 'restore' });
}

export { Y };
