import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from '@tanstack/react-router';
import type { Card } from '@/data/types';
import { createCard } from '@/data/repo/cards';
import { useBox, useCards, useTabs } from '@/hooks/data';
import { useSettings } from '@/app/settings-store';
import { useUI, type FilterMode, type SortMode } from '@/app/ui-store';
import { createCardFromText } from '@/app/actions';
import { useShell } from '@/app/shell-context';
import { Icon } from '@/components/ui/Icon';
import { Button, EmptyState, IconButton, Menu, Spinner, type MenuItemSpec } from '@/components/ui/primitives';
import { TabStrip } from '@/components/shell/TabStrip';
import { Omnibar } from '@/components/shell/Omnibar';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardEditor } from '@/components/editor/CardEditor';
import { TabDialog } from '@/components/dialogs/TabDialog';
import { BoxDialog } from '@/components/dialogs/BoxDialog';
import { trashBox } from '@/app/actions';
import { useMediaQuery } from '@/hooks/media';

export function BoxPage({ boxId, tabId, cardId }: { boxId: string; tabId?: string; cardId?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const box = useBox(boxId);
  const tabs = useTabs(boxId);
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const shell = useShell();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [tabDialog, setTabDialog] = useState(false);
  const [boxDialog, setBoxDialog] = useState(false);
  const sort = useUI((s) => s.sort);
  const setSort = useUI((s) => s.setSort);
  const filter = useUI((s) => s.filter);
  const setFilter = useUI((s) => s.setFilter);
  const selectedId = useUI((s) => s.selectedCardId);
  const setQuery = useUI((s) => s.setQuery);

  // Resolve the active tab: URL, then last used, then first.
  const activeTab = useMemo(() => {
    if (!tabs) return undefined;
    if (tabId) return tabs.find((x) => x.id === tabId) ?? null;
    const last = settings.lastTabByBox[boxId];
    return tabs.find((x) => x.id === last) ?? tabs[0] ?? null;
  }, [tabs, tabId, settings.lastTabByBox, boxId]);

  const cards = useCards(boxId, activeTab?.id);

  // Remember position.
  useEffect(() => {
    if (!box || !activeTab) return;
    if (settings.lastBoxId === boxId && settings.lastTabByBox[boxId] === activeTab.id) return;
    void update({ lastBoxId: boxId, lastTabByBox: { ...settings.lastTabByBox, [boxId]: activeTab.id } });
  }, [box, activeTab, boxId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setQuery('');
  }, [activeTab?.id, setQuery]);

  const openCard = useCallback(
    (id: string) => {
      if (!activeTab) return;
      void navigate({ to: '/b/$boxId/t/$tabId/c/$cardId', params: { boxId, tabId: activeTab.id, cardId: id } });
    },
    [navigate, boxId, activeTab],
  );
  const closeCard = useCallback(() => {
    if (!activeTab) return;
    void navigate({ to: '/b/$boxId/t/$tabId', params: { boxId, tabId: activeTab.id } });
  }, [navigate, boxId, activeTab]);

  const newCard = useCallback(
    async (type: 'text' | 'table' = 'text') => {
      if (!activeTab) {
        setTabDialog(true);
        return;
      }
      const id = await createCard(boxId, activeTab.id, { type, title: '', body: type === 'text' ? { md: '' } : { columns: [], rows: [], footer: {} } });
      openCard(id);
    },
    [activeTab, boxId, openCard],
  );

  useEffect(() => {
    shell.setNewCard(() => void newCard('text'));
    return () => shell.setNewCard(null);
  }, [newCard, shell]);

  // Paste anywhere in the grid (or the palette command) creates a card; the palette can also ask for a new tab.
  useEffect(() => {
    const fromText = (text: string) => {
      if (!activeTab || !text.trim()) return;
      void createCardFromText(boxId, activeTab.id, text).then((id) => {
        useUI.getState().toast({ message: t('shell.pasteCreated'), kind: 'success', action: { label: t('common.open'), onClick: () => openCard(id) } });
      });
    };
    const onPaste = (e: ClipboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (cardId) return;
      const text = e.clipboardData?.getData('text/plain');
      if (!text?.trim()) return;
      e.preventDefault();
      fromText(text);
    };
    const onCommandPaste = (e: Event) => fromText(String((e as CustomEvent<string>).detail ?? ''));
    const onNewTab = () => setTabDialog(true);
    window.addEventListener('paste', onPaste);
    document.addEventListener('boxy:paste', onCommandPaste);
    document.addEventListener('boxy:new-tab', onNewTab);
    return () => {
      window.removeEventListener('paste', onPaste);
      document.removeEventListener('boxy:paste', onCommandPaste);
      document.removeEventListener('boxy:new-tab', onNewTab);
    };
  }, [activeTab, boxId, cardId, openCard, t]);

  const openCardData = cards?.find((c) => c.id === cardId) ?? null;

  if (box === undefined || tabs === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        <Spinner />
      </div>
    );
  }
  if (box === null) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon="box" title={t('errors.boxNotFound')} action={<Button onClick={() => void navigate({ to: '/' })}>{t('errors.goHome')}</Button>} />
      </div>
    );
  }
  if (!tabId && activeTab) return <Navigate to="/b/$boxId/t/$tabId" params={{ boxId, tabId: activeTab.id }} replace />;

  const filterItems: MenuItemSpec[] = [
    ...(
      [
        ['all', t('shell.filterAll')],
        ['pinned', t('shell.filterPinned')],
        ['hasVars', t('shell.filterHasVars')],
        ['recent', t('shell.filterRecent')],
      ] as [FilterMode, string][]
    ).map(([v, label]) => ({ id: v, label, checked: filter === v, onSelect: () => setFilter(v) })),
  ];
  const sortItems: MenuItemSpec[] = (
    [
      ['manual', t('shell.sortManual')],
      ['title', t('shell.sortTitle')],
      ['newest', t('shell.sortNewest')],
      ['updated', t('shell.sortUpdated')],
      ['mostCopied', t('shell.sortMostCopied')],
      ['lastCopied', t('shell.sortLastCopied')],
    ] as [SortMode, string][]
  ).map(([v, label]) => ({ id: v, label, checked: sort === v, onSelect: () => setSort(v) }));
  const boxMenu: MenuItemSpec[] = [
    { id: 'edit', label: t('shell.editBox'), icon: 'pencil', onSelect: () => setBoxDialog(true) },
    { id: 'newtab', label: t('shell.newTab'), icon: 'plus', onSelect: () => setTabDialog(true) },
    { id: 'export', label: t('import.exportBox'), icon: 'download', onSelect: () => void import('@/app/backup').then((m) => m.exportBox(box.id, box.name)) },
    { id: 'trash', label: t('common.moveToTrash'), icon: 'trash-2', danger: true, separatorBefore: true, onSelect: () => void trashBox(box.id, box.name).then(() => navigate({ to: '/' })) },
  ];

  const editor = openCardData ? <CardEditor key={openCardData.id} card={openCardData} onClose={closeCard} onNeedsFill={(c) => shell.openFill(c)} fullscreen={isMobile} /> : null;

  if (isMobile && editor) return <div className="h-full">{editor}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabStrip box={box} tabs={tabs} activeTabId={activeTab?.id} />
      <Omnibar box={box} tab={activeTab} onNewCard={() => void newCard('text')} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-line px-3 py-1 text-[0.85em]">
            <Menu label={t('shell.filter')} align="start" trigger={<button type="button" className="chip" data-on={filter !== 'all' ? 'true' : undefined}><Icon name="filter" size={13} /> {filter === 'all' ? t('shell.filter') : filterItems.find((f) => f.id === filter)?.label}</button>} items={filterItems} />
            <Menu label={t('shell.sort')} align="start" trigger={<button type="button" className="chip" data-on={sort !== 'manual' ? 'true' : undefined}><Icon name="arrow-up-down" size={13} /> {sortItems.find((s) => s.id === sort)?.label}</button>} items={sortItems} />
            <span className="ml-auto text-dim">{cards ? t('common.cards', { count: cards.length }) : ''}</span>
            <Menu label={`${box.name}: ${t('common.menu')}`} trigger={<IconButton icon="ellipsis" label={t('common.more')} tooltip={false} />} items={boxMenu} />
            <Menu label={t('common.new')} trigger={<IconButton icon="plus" label={t('common.new')} tooltip={false} />} items={[{ id: 'text', label: t('cards.typeText'), icon: 'file-text', onSelect: () => void newCard('text') }, { id: 'table', label: t('cards.typeTable'), icon: 'table', onSelect: () => void newCard('table') }]} />
          </div>
          <div className="min-h-0 flex-1">
            {activeTab && cards ? (
              <CardGrid box={box} tab={activeTab} tabs={tabs} cards={cards} selectedId={selectedId} onOpen={openCard} onNeedsFill={(c: Card) => shell.openFill(c)} onNewCard={() => void newCard('text')} />
            ) : tabs.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <EmptyState icon="folder-plus" title={t('shell.emptyBox')} body={t('shell.emptyBoxBody')} action={<Button variant="primary" icon="plus" onClick={() => setTabDialog(true)}>{t('shell.newTab')}</Button>} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <Spinner />
              </div>
            )}
          </div>
        </div>
        {editor ? <aside className="w-[min(560px,48%)] shrink-0 slide-up">{editor}</aside> : null}
      </div>
      <TabDialog open={tabDialog} onOpenChange={setTabDialog} boxId={box.id} onCreated={(id) => void navigate({ to: '/b/$boxId/t/$tabId', params: { boxId: box.id, tabId: id } })} />
      <BoxDialog open={boxDialog} onOpenChange={setBoxDialog} box={box} />
    </div>
  );
}
