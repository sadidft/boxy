import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { reorderTab, updateTab } from '@/data/repo/tabs';
import { useCardIndex } from '@/hooks/data';
import { trashTab } from '@/app/actions';
import { useUI } from '@/app/ui-store';
import type { BoxMeta, Tab } from '@/data/types';
import { Icon } from '@/components/ui/Icon';
import { IconButton, Menu, type MenuItemSpec } from '@/components/ui/primitives';
import { TabDialog } from '@/components/dialogs/TabDialog';

function TabItem({ box, tab, active, count, onEdit, onMove }: { box: BoxMeta; tab: Tab; active: boolean; count: number; onEdit: () => void; onMove: (dir: -1 | 1) => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);
  const items: MenuItemSpec[] = [
    { id: 'edit', label: t('shell.editTab'), icon: 'pencil', onSelect: onEdit },
    { id: 'pin', label: tab.pinned ? t('shell.unpinTab') : t('shell.pinTab'), icon: tab.pinned ? 'pin-off' : 'pin', onSelect: () => void updateTab(box.id, tab.id, { pinned: !tab.pinned }) },
    { id: 'left', label: t('shell.moveLeft'), icon: 'arrow-left', onSelect: () => onMove(-1) },
    { id: 'right', label: t('shell.moveRight'), icon: 'arrow-right', onSelect: () => onMove(1) },
    { id: 'trash', label: t('common.moveToTrash'), icon: 'trash-2', danger: true, separatorBefore: true, onSelect: () => void trashTab(box.id, tab.id, tab.name) },
  ];
  return (
    <div className={`group relative flex h-[33px] max-w-[220px] shrink-0 items-center rounded-t-[9px] border border-transparent text-[0.95em] ${active ? 'border-line border-b-bg bg-bg text-text' : 'text-muted hover:bg-surface2/60'}`} style={active ? { marginBottom: -1 } : undefined}>
      <Link
        ref={ref}
        to="/b/$boxId/t/$tabId"
        params={{ boxId: box.id, tabId: tab.id }}
        className="flex h-full min-w-0 items-center gap-1.5 rounded-t-[9px] pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset no-drag"
        aria-current={active ? 'page' : undefined}
        onDoubleClick={onEdit}
      >
        {tab.pinned ? <Icon name="pin" size={13} className="text-accent" /> : <Icon name={tab.icon} size={14} className={active ? 'text-text' : 'text-dim'} />}
        <span className="truncate">{tab.name}</span>
        <span className={`ml-1 rounded-full px-1.5 text-[10px] leading-[16px] ${active ? 'bg-accent-soft text-accent' : 'bg-surface2 text-dim'}`} aria-label={t('shell.cardCount', { count })}>
          {count}
        </span>
      </Link>
      <Menu
        label={t('common.menu')}
        trigger={
          <button type="button" className="icon-btn no-drag mr-0.5 h-6 w-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100" style={{ width: 22, height: 22 }} aria-label={`${tab.name}: ${t('common.menu')}`}>
            <Icon name="chevron-down" size={13} />
          </button>
        }
        items={items}
      />
    </div>
  );
}

export function TabStrip({ box, tabs, activeTabId }: { box: BoxMeta; tabs: Tab[]; activeTabId?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<{ open: boolean; tab: Tab | null }>({ open: false, tab: null });
  const counts = useCardIndex(box.id, undefined);
  const countByTab = new Map<string, number>();
  for (const c of counts ?? []) countByTab.set(c.tabId, (countByTab.get(c.tabId) ?? 0) + 1);
  const toggleRail = useUI((s) => s.toggleRail);
  const view = useUI((s) => s.view);
  const setView = useUI((s) => s.setView);

  const move = async (tab: Tab, dir: -1 | 1) => {
    const group = tabs.filter((x) => x.pinned === tab.pinned);
    const i = group.findIndex((x) => x.id === tab.id);
    const j = i + dir;
    if (j < 0 || j >= group.length) return;
    const target = group[j]!;
    const after = dir === 1 ? target : group[j - 1] ?? null;
    const before = dir === 1 ? group[j + 1] ?? null : target;
    await reorderTab(box.id, tab.id, after?.id ?? null, before?.id ?? null);
  };

  return (
    <div className="drag-region flex h-[var(--shell-tabs)] items-end gap-0.5 border-b border-line bg-surface/60 px-2 pt-1.5 pl-2.5">
      <IconButton icon="panel-left" label={t('shell.boxes')} onClick={toggleRail} className="no-drag mb-0.5 md:hidden" />
      <div className="flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label={t('shell.allTabs')}>
        {tabs.map((tab) => (
          <TabItem key={tab.id} box={box} tab={tab} active={tab.id === activeTabId} count={countByTab.get(tab.id) ?? 0} onEdit={() => setDialog({ open: true, tab })} onMove={(dir) => void move(tab, dir)} />
        ))}
        <button type="button" className="no-drag mb-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface2 hover:text-text" aria-label={t('shell.newTab')} onClick={() => setDialog({ open: true, tab: null })}>
          <Icon name="plus" size={16} />
        </button>
      </div>
      <div className="no-drag mb-0.5 ml-auto hidden items-center gap-0.5 md:flex">
        <div className="seg" role="group" aria-label={t('shell.viewGrid')}>
          <button type="button" aria-pressed={view === 'grid'} aria-label={t('shell.viewGrid')} onClick={() => setView('grid')}>
            <Icon name="layout-grid" size={14} />
          </button>
          <button type="button" aria-pressed={view === 'list'} aria-label={t('shell.viewList')} onClick={() => setView('list')}>
            <Icon name="list" size={14} />
          </button>
          <button type="button" aria-pressed={view === 'masonry'} aria-label={t('shell.viewMasonry')} onClick={() => setView('masonry')}>
            <Icon name="layout-dashboard" size={14} />
          </button>
        </div>
      </div>
      <TabDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} boxId={box.id} tab={dialog.tab} onCreated={(id) => void navigate({ to: '/b/$boxId/t/$tabId', params: { boxId: box.id, tabId: id } })} />
    </div>
  );
}
