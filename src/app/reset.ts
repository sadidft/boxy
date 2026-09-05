import { getDB } from '@/data/db';
import { closeAllDocs, destroyDocStorage } from '@/data/ydoc';
import { detachAllForTests } from '@/data/store';

/** Removes every Box document, the Dexie database and local preferences. Used by Settings > Storage > Reset. */
export async function destroyAllData(): Promise<void> {
  const db = getDB();
  const boxes = await db.boxes.toArray();
  closeAllDocs();
  detachAllForTests();
  for (const b of boxes) await destroyDocStorage(b.id);
  const trash = await db.trash.where('entity').equals('box').toArray();
  for (const t of trash) await destroyDocStorage(t.boxId);
  await db.delete();
  try {
    localStorage.removeItem('boxy.theme');
    localStorage.removeItem('boxy.view');
    localStorage.removeItem('boxy.icons.recent');
  } catch {
    // ignore
  }
}
