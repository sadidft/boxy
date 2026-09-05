import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BoxMeta, Card, LabelColor, Tab, TableBody, TextBody } from '@/data/types';
import { createCard, moveCard, updateCard } from '@/data/repo/cards';
import { sortByOrder } from '@/data/order';
import { labelColors } from '@/styles/tokens';
import { copyCard, needsFill, trashCard } from '@/app/actions';
import { toast, useUI, type FilterMode, type SortMode, type ViewMode } from '@/app/ui-store';
import type { CopyFormat } from '@/core/copy';
import { markdownToPlain } from '@/core/markdown';
import { hasDynamicContent } from '@/core/template';
import { Button, EmptyState, type MenuItemSpec } from '@/components/ui/primitives';
import { CardItem } from './CardItem';

export interface CardGridProps {
  box: BoxMeta;
  tab: Tab;
  tabs: Tab[];
  cards: Card[];
  selectedId: string | null;
  onOpen: (cardId: string) => void;
  onNeedsFill: (card: Card) => void;
  onNewCard: () => void;
}

const GRID_MIN_COL = 280;

export function matchesQuery(card: Card, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/);
  const body = card.type === 'text' ? (card.body as TextBody).md : [...(card.body as TableBody).columns.map((c) => c.name), ...(card.body as TableBody).rows.flatMap((r) => Object.values(r.cells))].join(' ');
  const hay = `${card.title}\n${body}`.toLowerCase();
  return tokens.every((tok) => {
    if (tok.startsWith('#')) {
      const tag = tok.slice(1);
      return tag ? card.tags.some((x) => x.toLowerCase().includes(tag)) : true;
    }
    if (tok === 'is:pinned') return card.pinned;
    if (tok === 'is:template') return card.type === 'text' && hasDynamicContent((card.body as TextBody).md);
    if (tok === 'type:table') return card.type === 'table';
    if (tok === 'type:text') return card.type === 'text';
    return hay.includes(tok) || card.tags.some((x) => x.toLowerCase().includes(tok));
  });
}

export function matchesFilter(card: Card, filter: FilterMode, now = Date.now()): boolean {
  if (filter === 'all') return true;
  if (filter === 'pinned') return card.pinned;
  if (filter === 'hasVars') return card.type === 'text' && hasDynamicContent((card.body as TextBody).md);
  if (filter === 'recent') return (card.stats.lastCopiedAt ?? 0) > now - 7 * 86_400_000 || card.updatedAt > now - 7 * 86_400_000;
  if (filter.startsWith('tag:')) {
    const tag = filter.slice(4).toLowerCase();
    return card.tags.some((x) => x.toLowerCase() === tag);
  }
  return true;
}

export function sortCards(cards: Card[], sort: SortMode): Card[] {
  const pinnedFirst = (a: Card, b: Card) => Number(b.pinned) - Number(a.pinned);
  const list = [...cards];
  switch (sort) {
    case 'title':
      return list.sort((a, b) => pinnedFirst(a, b) || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    case 'newest':
      return list.sort((a, b) => pinnedFirst(a, b) || b.createdAt - a.createdAt);
    case 'updated':
      return list.sort((a, b) => pinnedFirst(a, b) || b.updatedAt - a.updatedAt);
    case 'mostCopied':
      return list.sort((a, b) => pinnedFirst(a, b) || b.stats.copyCount - a.stats.copyCount || b.updatedAt - a.updatedAt);
    case 'lastCopied':
      return list.sort((a, b) => pinnedFirst(a, b) || (b.stats.lastCopiedAt ?? 0) - (a.stats.lastCopiedAt ?? 0));
    default:
      return sortByOrder(list).sort(pinnedFirst);
  }
}

function useColumns(ref: React.RefObject<HTMLElement | null>, view: ViewMode): number {
  const [cols, setCols] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      if (view === 'list') {
        setCols(1);
        return;
      }
      const w = el.clientWidth;
      setCols(Math.max(1, Math.floor((w + 12) / (GRID_MIN_COL + 12))));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, view]);
  return cols;
}

export function CardGrid({ box, tab, tabs, cards, selectedId, onOpen, onNeedsFill, onNewCard }: CardGridProps) {
  const { t } = useTranslation();
  const view = useUI((s) => s.view);
  const sort = useUI((s) => s.sort);
  const filter = useUI((s) => s.filter);
  const query = useUI((s) => s.query);
  const select = useUI((s) => s.select);
  const setQuery = useUI((s) => s.setQuery);
  const setFilter = useUI((s) => s.setFilter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cols = useColumns(scrollRef, view);

  const visible = useMemo(() => sortCards(cards.filter((c) => matchesFilter(c, filter) && matchesQuery(c, query)), sort), [cards, filter, query, sort]);

  const rows = useMemo(() => {
    if (view === 'masonry') return [];
    const out: Card[][] = [];
    for (let i = 0; i < visible.length; i += cols) out.push(visible.slice(i, i + cols));
    return out;
  }, [visible, cols, view]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (view === 'list' ? 52 : 300),
    overscan: 4,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  // Masonry: balanced columns, rendered progressively.
  const [masonryLimit, setMasonryLimit] = useState(60);
  useEffect(() => setMasonryLimit(60), [tab.id, query, filter]);
  const masonryCols = useMemo(() => {
    if (view !== 'masonry') return [];
    const out: Card[][] = Array.from({ length: cols }, () => []);
    const heights = new Array<number>(cols).fill(0);
    for (const card of visible.slice(0, masonryLimit)) {
      const i = heights.indexOf(Math.min(...heights));
      out[i]!.push(card);
      const est = card.type === 'table' ? 200 : Math.min(260, 90 + Math.ceil(((card.body as TextBody).md.length || 20) / 40) * 20);
      heights[i] = heights[i]! + est;
    }
    return out;
  }, [visible, cols, view, masonryLimit]);

  const copyNow = useCallback(
    async (card: Card, format?: CopyFormat) => {
      const parsed = needsFill(card);
      if (parsed) {
        onNeedsFill(card);
        return;
      }
      await copyCard(card, format);
    },
    [onNeedsFill],
  );

  const duplicate = async (card: Card) => {
    await createCard(box.id, card.tabId, { type: card.type === 'table' ? 'table' : 'text', title: `${card.title} (${t('cards.duplicateSuffix')})`, body: card.body, tags: card.tags });
  };

  const menuFor = useCallback(
    (card: Card): MenuItemSpec[] => {
      const otherTabs = tabs.filter((x) => x.id !== card.tabId);
      return [
        { id: 'open', label: t('cards.openCard'), icon: 'pencil', onSelect: () => onOpen(card.id) },
        { id: 'pin', label: card.pinned ? t('cards.unpin') : t('cards.pin'), icon: card.pinned ? 'pin-off' : 'pin', onSelect: () => void updateCard(box.id, card.id, { pinned: !card.pinned }) },
        {
          id: 'label',
          label: t('cards.label'),
          icon: 'tag',
          children: [
            { id: 'none', label: t('cards.noLabel'), checked: !card.label, onSelect: () => void updateCard(box.id, card.id, { label: null }) },
            ...labelColors.map((c) => ({ id: c, label: t(`cards.labels.${c}`), checked: card.label === c, onSelect: () => void updateCard(box.id, card.id, { label: c as LabelColor }) })),
          ],
        },
        {
          id: 'slot',
          label: t('cards.quickSlot'),
          icon: 'zap',
          children: [
            ...Array.from({ length: 9 }, (_, i) => i + 1).map((n) => ({ id: `s${n}`, label: t('shell.quickSlot', { n }), checked: card.quickSlot === n, onSelect: () => void updateCard(box.id, card.id, { quickSlot: n }) })),
            { id: 'clear', label: t('cards.clearSlot'), separatorBefore: true, disabled: !card.quickSlot, onSelect: () => void updateCard(box.id, card.id, { quickSlot: null }) },
          ],
        },
        {
          id: 'move',
          label: t('cards.moveTo'),
          icon: 'folder-input',
          disabled: otherTabs.length === 0,
          children: otherTabs.map((x) => ({
            id: x.id,
            label: x.name,
            icon: x.icon,
            onSelect: () => {
              void moveCard(box.id, card.id, x.id, null, null).then(() => toast(t('cards.movedTo', { tab: x.name })));
            },
          })),
        },
        { id: 'dup', label: t('cards.duplicate'), icon: 'copy-plus', onSelect: () => void duplicate(card) },
        { id: 'trash', label: t('common.moveToTrash'), icon: 'trash-2', danger: true, separatorBefore: true, onSelect: () => void trashCard(box.id, card.id) },
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabs, box.id, onOpen, t],
  );

  const copyMenuFor = useCallback(
    (card: Card): MenuItemSpec[] => {
      if (card.type === 'table') {
        return [
          { id: 'csv', label: t('cards.copyCsv'), onSelect: () => void copyNow(card, 'csv') },
          { id: 'tsv', label: t('cards.copyTsv'), onSelect: () => void copyNow(card, 'tsv') },
          { id: 'mdtable', label: t('cards.copyMarkdownTable'), onSelect: () => void copyNow(card, 'mdtable') },
          { id: 'html', label: t('cards.copyHtml'), onSelect: () => void copyNow(card, 'html') },
        ];
      }
      return [
        { id: 'plain', label: t('cards.copyPlain'), onSelect: () => void copyNow(card, 'plain') },
        { id: 'markdown', label: t('cards.copyMarkdown'), onSelect: () => void copyNow(card, 'markdown') },
        { id: 'html', label: t('cards.copyHtml'), onSelect: () => void copyNow(card, 'html') },
      ];
    },
    [copyNow, t],
  );

  // Roving keyboard navigation between cards.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.matches('[data-card-id]')) return;
    const id = target.getAttribute('data-card-id');
    const idx = visible.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const card = visible[idx]!;
    let next = -1;
    if (e.key === 'ArrowRight' || (e.key === 'ArrowDown' && (view === 'list' || cols === 1))) next = idx + 1;
    else if (e.key === 'ArrowLeft' || (e.key === 'ArrowUp' && (view === 'list' || cols === 1))) next = idx - 1;
    else if (e.key === 'ArrowDown') next = idx + cols;
    else if (e.key === 'ArrowUp') next = idx - cols;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = visible.length - 1;
    else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      void copyNow(card);
      return;
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      void trashCard(box.id, card.id);
      return;
    } else if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      void updateCard(box.id, card.id, { pinned: !card.pinned });
      return;
    } else return;
    e.preventDefault();
    if (next < 0 || next >= visible.length) return;
    const nextCard = visible[next]!;
    select(nextCard.id);
    if (view !== 'masonry') virtualizer.scrollToIndex(Math.floor(next / cols), { align: 'auto' });
    requestAnimationFrame(() => {
      scrollRef.current?.querySelector<HTMLElement>(`[data-card-id="${nextCard.id}"]`)?.focus();
    });
  };

  const renderCard = (card: Card) => (
    <CardItem key={card.id} card={card} selected={card.id === selectedId} view={view} onOpen={() => onOpen(card.id)} onCopy={() => void copyNow(card)} onSelect={() => select(card.id)} menuItems={menuFor(card)} copyMenuItems={copyMenuFor(card)} />
  );

  if (cards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon="layout-grid" title={t('shell.emptyTitle')} body={t('shell.emptyBody', { shortcut: 'Ctrl+V' })} action={<Button variant="primary" icon="plus" onClick={onNewCard}>{t('palette.cmdNewCard')}</Button>} />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon="search-x"
          title={query ? t('shell.noResults', { query }) : t('shell.emptyTitle')}
          action={
            <Button
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              {t('shell.clearFilters')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain px-3 py-3" onKeyDown={onKeyDown} role="list" aria-label={`${tab.name}: ${t('common.cards', { count: visible.length })}`}>
      {view === 'masonry' ? (
        <div className="flex items-start gap-[var(--card-gap)]">
          {masonryCols.map((col, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-[var(--card-gap)]">
              {col.map(renderCard)}
            </div>
          ))}
          {visible.length > masonryLimit ? (
            <div className="w-full pt-2 text-center">
              <Button onClick={() => setMasonryLimit((n) => n + 60)}>{t('palette.showAll')}</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const row = rows[vi.index]!;
            return (
              <div key={vi.key} data-index={vi.index} ref={virtualizer.measureElement} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)`, paddingBottom: 'var(--card-gap)' }}>
                <div className={view === 'list' ? 'flex flex-col gap-1.5' : 'grid gap-[var(--card-gap)]'} style={view === 'list' ? undefined : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {row.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function cardPlainText(card: Card): string {
  return card.type === 'text' ? markdownToPlain((card.body as TextBody).md) : (card.body as TableBody).columns.map((c) => c.name).join(', ');
}
