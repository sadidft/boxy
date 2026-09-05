import { createBox } from '@/data/repo/boxes';
import { createTab } from '@/data/repo/tabs';
import { createCard } from '@/data/repo/cards';
import { flushProjections } from '@/data/store';
import type { Locale } from '@/i18n';
import { getPack, type PackId } from './index';

/** Creates one Box per pack with its Tabs and Cards. Returns the new box ids in order. */
export async function installPacks(ids: PackId[], locale: Locale): Promise<string[]> {
  const boxIds: string[] = [];
  for (const id of ids) {
    const pack = getPack(id);
    if (!pack) continue;
    const boxId = await createBox({ name: pack.name[locale], icon: pack.icon, color: pack.color });
    for (const tab of pack.tabs[locale]) {
      const tabId = await createTab(boxId, { name: tab.name, icon: tab.icon });
      for (const card of tab.cards) {
        await createCard(boxId, tabId, { type: card.type, title: card.title, body: card.body, tags: card.tags ?? [], pinned: card.pinned ?? false });
      }
    }
    await flushProjections(boxId);
    boxIds.push(boxId);
  }
  return boxIds;
}

export async function installEmpty(names: { box: string; tab: string }): Promise<string> {
  const boxId = await createBox({ name: names.box, icon: 'box', color: 'mint' });
  await createTab(boxId, { name: names.tab, icon: 'folder' });
  await flushProjections(boxId);
  return boxId;
}
