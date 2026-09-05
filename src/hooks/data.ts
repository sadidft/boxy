import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDB } from '@/data/db';
import { subscribeBox } from '@/data/store';
import { listTabs } from '@/data/repo/tabs';
import { getCard, listCards } from '@/data/repo/cards';
import type { BoxId, BoxMeta, Card, CardId, CardIndex, Tab, TabId, TrashItem } from '@/data/types';

/** All non-archived boxes, ordered. Live. */
export function useBoxes(includeArchived = false): BoxMeta[] | undefined {
  return useLiveQuery(async () => {
    const all = await getDB().boxes.orderBy('order').toArray();
    return includeArchived ? all : all.filter((b) => !b.archived);
  }, [includeArchived]);
}

export function useBox(boxId: BoxId | undefined): BoxMeta | undefined | null {
  return useLiveQuery(async () => (boxId ? ((await getDB().boxes.get(boxId)) ?? null) : null), [boxId]);
}

/** Tabs of a box from the Y.Doc. Live via doc subscription. */
export function useTabs(boxId: BoxId | undefined): Tab[] | undefined {
  const [tabs, setTabs] = useState<Tab[] | undefined>(undefined);
  useEffect(() => {
    if (!boxId) {
      setTabs(undefined);
      return;
    }
    let active = true;
    setTabs(undefined);
    const unsubscribe = subscribeBox(boxId, () => {
      void listTabs(boxId).then((t) => {
        if (active) setTabs(t);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [boxId]);
  return tabs;
}

/** Light card index rows for a tab (fast lists). Live. */
export function useCardIndex(boxId: BoxId | undefined, tabId: TabId | undefined): CardIndex[] | undefined {
  return useLiveQuery(async () => {
    if (!boxId) return [];
    if (!tabId) return getDB().cards_index.where('boxId').equals(boxId).toArray();
    return getDB().cards_index.where('[boxId+tabId]').equals([boxId, tabId]).toArray();
  }, [boxId, tabId]);
}

/** Full cards of a tab (for rendering bodies). Live via doc subscription. */
export function useCards(boxId: BoxId | undefined, tabId: TabId | undefined): Card[] | undefined {
  const [cards, setCards] = useState<Card[] | undefined>(undefined);
  useEffect(() => {
    if (!boxId || !tabId) {
      setCards(undefined);
      return;
    }
    let active = true;
    const unsubscribe = subscribeBox(boxId, () => {
      void listCards(boxId, tabId).then((c) => {
        if (active) setCards(c);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [boxId, tabId]);
  return cards;
}

export function useCard(boxId: BoxId | undefined, cardId: CardId | undefined): Card | undefined | null {
  const [card, setCard] = useState<Card | undefined | null>(undefined);
  useEffect(() => {
    if (!boxId || !cardId) {
      setCard(null);
      return;
    }
    let active = true;
    const unsubscribe = subscribeBox(boxId, () => {
      void getCard(boxId, cardId).then((c) => {
        if (active) setCard(c ?? null);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [boxId, cardId]);
  return card;
}

export function useAllTags(): { tag: string; count: number }[] | undefined {
  return useLiveQuery(async () => {
    const rows = await getDB().cards_index.toArray();
    const counts = new Map<string, number>();
    for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, []);
}

export function useQuickSlots(): CardIndex[] | undefined {
  return useLiveQuery(async () => getDB().cards_index.where('quickSlot').above(0).sortBy('quickSlot'), []);
}

export function useRecentCopied(limit = 30): CardIndex[] | undefined {
  return useLiveQuery(async () => getDB().cards_index.where('lastCopiedAt').above(0).reverse().limit(limit).toArray(), [limit]);
}

export function useTrash(): TrashItem[] | undefined {
  return useLiveQuery(async () => getDB().trash.orderBy('deletedAt').reverse().toArray(), []);
}

export function useCounts(): { boxes: number; cards: number; trash: number } | undefined {
  return useLiveQuery(async () => {
    const db = getDB();
    const [boxes, cards, trash] = await Promise.all([db.boxes.count(), db.cards_index.count(), db.trash.count()]);
    return { boxes, cards, trash };
  }, []);
}
