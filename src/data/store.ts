import * as Y from 'yjs';
import { getDB } from './db';
import { LOCAL_ORIGIN, onDocClosed, openDoc, releaseDoc, peekDoc, type OpenDoc } from './ydoc';
import { boxMetaFromY, cardFromY, indexFromCard } from './codec';
import type { BoxId, BoxMeta, CardId, CardIndex } from './types';

/**
 * Keeps Dexie projections (`boxes`, `cards_index`) in sync with each open Y.Doc.
 * Observers are attached once per open doc. Changes are projected incrementally (only touched
 * cards are re-indexed) and debounced per box; `projectBox` performs a full rebuild.
 */
interface Tracker {
  off: () => void;
  dirty: Set<CardId>;
  metaDirty: boolean;
  full: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  inflight: Promise<void> | null;
}

const trackers = new Map<BoxId, Tracker>();
const FLUSH_MS = 50;

onDocClosed((boxId) => {
  const t = trackers.get(boxId);
  if (!t) return;
  t.off();
  if (t.timer) clearTimeout(t.timer);
  trackers.delete(boxId);
});

function metaOf(doc: Y.Doc, cardCount: number): BoxMeta {
  return { ...boxMetaFromY(doc), cardCount, tabCount: doc.getMap('tabs').size };
}

/** Full rebuild of the projections of one box. */
export async function projectBox(boxId: BoxId): Promise<void> {
  const entry = peekDoc(boxId);
  if (!entry) return;
  const tracker = trackers.get(boxId);
  if (tracker) {
    tracker.dirty.clear();
    tracker.metaDirty = false;
    tracker.full = false;
    if (tracker.timer) {
      clearTimeout(tracker.timer);
      tracker.timer = null;
    }
  }
  const db = getDB();
  const doc = entry.doc;
  const cardsY = doc.getMap('cards') as Y.Map<Y.Map<unknown>>;
  const rows: CardIndex[] = [];
  cardsY.forEach((cm) => rows.push(indexFromCard(cardFromY(boxId, cm))));
  const meta = metaOf(doc, rows.length);
  await db.transaction('rw', db.boxes, db.cards_index, async () => {
    const existing = await db.cards_index.where('boxId').equals(boxId).primaryKeys();
    const keep = new Set(rows.map((r) => r.id));
    const stale = existing.filter((id) => !keep.has(id));
    if (stale.length) await db.cards_index.bulkDelete(stale);
    if (rows.length) await db.cards_index.bulkPut(rows);
    if (meta.name || meta.createdAt) await db.boxes.put(meta);
  });
}

async function projectDirty(boxId: BoxId): Promise<void> {
  const entry = peekDoc(boxId);
  const tracker = trackers.get(boxId);
  if (!entry || !tracker) return;
  if (tracker.full) {
    await projectBox(boxId);
    return;
  }
  const ids = [...tracker.dirty];
  tracker.dirty.clear();
  tracker.metaDirty = false;
  const db = getDB();
  const doc = entry.doc;
  const cardsY = doc.getMap('cards') as Y.Map<Y.Map<unknown>>;
  const puts: CardIndex[] = [];
  const dels: CardId[] = [];
  for (const id of ids) {
    const cm = cardsY.get(id);
    if (cm) puts.push(indexFromCard(cardFromY(boxId, cm)));
    else dels.push(id);
  }
  const meta = metaOf(doc, cardsY.size);
  await db.transaction('rw', db.boxes, db.cards_index, async () => {
    if (dels.length) await db.cards_index.bulkDelete(dels);
    if (puts.length) await db.cards_index.bulkPut(puts);
    if (meta.name || meta.createdAt) await db.boxes.put(meta);
  });
}

function schedule(boxId: BoxId): void {
  const tracker = trackers.get(boxId);
  if (!tracker) return;
  if (tracker.timer) clearTimeout(tracker.timer);
  tracker.timer = setTimeout(() => {
    tracker.timer = null;
    tracker.inflight = projectDirty(boxId).finally(() => {
      tracker.inflight = null;
    });
  }, FLUSH_MS);
}

/** Flushes pending projections (used before backups, exports and page hide). */
export async function flushProjections(boxId?: BoxId): Promise<void> {
  const ids = boxId ? [boxId] : [...trackers.keys()];
  await Promise.all(
    ids.map(async (id) => {
      const t = trackers.get(id);
      if (!t) return;
      if (t.timer) {
        clearTimeout(t.timer);
        t.timer = null;
      }
      if (t.inflight) await t.inflight;
      if (t.full || t.metaDirty || t.dirty.size) await projectDirty(id);
    }),
  );
}

function attach(boxId: BoxId, entry: OpenDoc): Tracker {
  const doc = entry.doc;
  const cardsY = doc.getMap('cards') as Y.Map<Y.Map<unknown>>;
  const tabsY = doc.getMap('tabs');
  const boxY = doc.getMap('box');
  const tracker: Tracker = { off: () => undefined, dirty: new Set(), metaDirty: false, full: true, timer: null, inflight: null };

  const onCards = (events: Y.YEvent<Y.AbstractType<unknown>>[]) => {
    for (const ev of events) {
      if (ev.target === cardsY) {
        ev.changes.keys.forEach((_change, key) => tracker.dirty.add(key));
      } else {
        const id = ev.path[0];
        if (typeof id === 'string') tracker.dirty.add(id);
      }
    }
    schedule(boxId);
  };
  const onMeta = () => {
    tracker.metaDirty = true;
    schedule(boxId);
  };
  cardsY.observeDeep(onCards);
  tabsY.observe(onMeta);
  boxY.observe(onMeta);
  tracker.off = () => {
    cardsY.unobserveDeep(onCards);
    tabsY.unobserve(onMeta);
    boxY.unobserve(onMeta);
  };
  trackers.set(boxId, tracker);
  return tracker;
}

export async function acquireBox(boxId: BoxId): Promise<OpenDoc> {
  const entry = openDoc(boxId);
  await entry.whenLoaded;
  if (!trackers.has(boxId) && peekDoc(boxId) === entry) {
    attach(boxId, entry);
    // First open in this session: rebuild once so the index heals from any drift.
    await projectBox(boxId);
  }
  return entry;
}

export function releaseBox(boxId: BoxId): void {
  releaseDoc(boxId);
}

/**
 * Runs `fn` inside a local transaction on the box doc and returns its result.
 * Projections are flushed before returning so Dexie reads right after a write are consistent.
 */
export async function withBox<T>(boxId: BoxId, fn: (doc: Y.Doc, entry: OpenDoc) => T): Promise<T> {
  const entry = await acquireBox(boxId);
  try {
    let result!: T;
    entry.doc.transact(() => {
      result = fn(entry.doc, entry);
    }, LOCAL_ORIGIN);
    await flushProjections(boxId);
    return result;
  } finally {
    releaseBox(boxId);
  }
}

/** Reads from a box doc without transacting. */
export async function readBox<T>(boxId: BoxId, fn: (doc: Y.Doc) => T): Promise<T> {
  const entry = await acquireBox(boxId);
  try {
    return fn(entry.doc);
  } finally {
    releaseBox(boxId);
  }
}

/** Subscribe to any change of a box doc (used by React hooks). Returns an unsubscribe function. */
export function subscribeBox(boxId: BoxId, cb: () => void): () => void {
  let active = true;
  let held: OpenDoc | null = null;
  const handler = () => cb();
  void acquireBox(boxId).then((e) => {
    if (!active) {
      releaseBox(boxId);
      return;
    }
    held = e;
    e.doc.on('update', handler);
    cb();
  });
  return () => {
    active = false;
    if (held) {
      held.doc.off('update', handler);
      releaseBox(boxId);
    }
  };
}

export function detachAllForTests(): void {
  for (const [id, t] of trackers) {
    t.off();
    if (t.timer) clearTimeout(t.timer);
    trackers.delete(id);
  }
}
