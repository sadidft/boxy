import Dexie, { type Table } from 'dexie';
import type {
  BoxMeta,
  CardIndex,
  Counter,
  GlobalVar,
  HandoffPayload,
  MigrationLog,
  Revision,
  SettingRow,
  TrashItem,
} from './types';

/**
 * Dexie holds settings, projections and everything that does not need CRDT merging.
 * Box, Tab and Card content lives in one Y.Doc per box (see ydoc.ts); `boxes` and `cards_index`
 * are projections of those docs and can always be rebuilt.
 */
export class BoxyDB extends Dexie {
  boxes!: Table<BoxMeta, string>;
  cards_index!: Table<CardIndex, string>;
  revisions!: Table<Revision, string>;
  trash!: Table<TrashItem, string>;
  globals!: Table<GlobalVar, string>;
  counters!: Table<Counter, string>;
  settings!: Table<SettingRow, string>;
  migrations!: Table<MigrationLog, string>;
  handoff!: Table<HandoffPayload, string>;

  constructor(name = 'boxy') {
    super(name);
    this.version(1).stores({
      boxes: 'id, order, archived, updatedAt',
      cards_index: 'id, boxId, tabId, [boxId+tabId], type, pinned, updatedAt, copyCount, lastCopiedAt, *tags, quickSlot',
      revisions: 'id, cardId, [cardId+rev], boxId, at',
      trash: 'id, entity, deletedAt, boxId',
      globals: 'key',
      counters: 'name',
      settings: 'key',
      migrations: 'id, at',
      handoff: 'id, receivedAt, imported',
    });
  }
}

let instance: BoxyDB | null = null;

export function getDB(): BoxyDB {
  if (!instance) instance = new BoxyDB();
  return instance;
}

/** Test helper: swap the database (fake-indexeddb) between test cases. */
export function _setDBForTests(db: BoxyDB | null): void {
  instance = db;
}
