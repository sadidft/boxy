import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { BoxyDB, _setDBForTests } from '@/data/db';
import { closeAllDocs } from '@/data/ydoc';
import { detachAllForTests } from '@/data/store';

// Fresh IndexedDB per test so repositories start from an empty store.
beforeEach(() => {
  const factory = new IDBFactory();
  globalThis.indexedDB = factory;
  Dexie.dependencies.indexedDB = factory;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  _setDBForTests(new BoxyDB());
});

afterEach(() => {
  detachAllForTests();
  closeAllDocs();
  _setDBForTests(null);
});
