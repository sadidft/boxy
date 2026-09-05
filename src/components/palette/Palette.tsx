import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { getDB } from '@/data/db';
import type { CardIndex } from '@/data/types';
import { useAllTags, useBoxes } from '@/hooks/data';
import { useUI } from '@/app/ui-store';
import { useSettings } from '@/app/settings-store';
import { copyCardById } from '@/app/actions';
import { buildIndex, searchIndex } from '@/core/search';
import { Icon } from '@/components/ui/Icon';
import { Kbd } from '@/components/ui/primitives';
import { BoxAvatar } from '@/components/shell/Rail';
import { modKey } from '@/hooks/format';

export interface Command {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  keywords?: string;
  run: () => void;
}

interface Item {
  key: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  run: () => void;
  copy?: () => void;
}

export function Palette({ commands, onNeedsFill }: { commands: Command[]; onNeedsFill: (boxId: string, cardId: string) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const open = useUI((s) => s.paletteOpen);
  const initial = useUI((s) => s.paletteInitial);
  const close = useUI((s) => s.closePalette);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const boxes = useBoxes(true);
  const tags = useAllTags();
  const rows = useLiveQuery(() => (open ? getDB().cards_index.toArray() : Promise.resolve([] as CardIndex[])), [open]);
  const index = useMemo(() => (rows && rows.length ? buildIndex(rows) : null), [rows]);
  const boxNames = useMemo(() => new Map((boxes ?? []).map((b) => [b.id, b.name])), [boxes]);
  const lastBoxId = useSettings((s) => s.settings.lastBoxId);

  useEffect(() => {
    if (open) {
      setQ(initial);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, initial]);

  const mode: 'commands' | 'tags' | 'boxes' | 'search' = q.startsWith('>') ? 'commands' : q.startsWith('#') && !q.includes(' ') ? 'tags' : q.startsWith('@') && !q.includes(' ') ? 'boxes' : 'search';
  const needle = q.slice(mode === 'search' ? 0 : 1).trim().toLowerCase();

  const items: Item[] = useMemo(() => {
    if (mode === 'commands') {
      return commands
        .filter((c) => !needle || `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(needle))
        .map((c) => ({ key: `cmd-${c.id}`, icon: <Icon name={c.icon} size={16} className="text-muted" />, title: c.label, trailing: c.shortcut ? <span className="text-[0.8em] text-dim">{c.shortcut}</span> : undefined, run: c.run }));
    }
    if (mode === 'tags') {
      return (tags ?? [])
        .filter((x) => !needle || x.tag.toLowerCase().includes(needle))
        .slice(0, 50)
        .map((x) => ({ key: `tag-${x.tag}`, icon: <Icon name="hash" size={16} className="text-muted" />, title: `#${x.tag}`, subtitle: t('common.cards', { count: x.count }), run: () => setQ(`#${x.tag} `) }));
    }
    if (mode === 'boxes') {
      return (boxes ?? [])
        .filter((b) => !needle || b.name.toLowerCase().includes(needle))
        .map((b) => ({ key: `box-${b.id}`, icon: <BoxAvatar box={b} size={22} />, title: b.name, subtitle: t('common.cards', { count: b.cardCount }), run: () => void navigate({ to: '/b/$boxId', params: { boxId: b.id } }) }));
    }
    const hits = searchIndex(index, rows ?? [], boxNames, q, 40);
    return hits.map(({ row }) => ({
      key: `card-${row.id}`,
      icon: <Icon name={row.type === 'table' ? 'table' : 'file-text'} size={16} className={row.type === 'table' ? 'text-label-amber' : 'text-label-mint'} />,
      title: row.title || t('common.untitled'),
      subtitle: `${boxNames.get(row.boxId) ?? ''}${row.preview ? ` · ${row.preview.replace(/\s+/g, ' ').slice(0, 90)}` : ''}`,
      trailing: row.pinned ? <Icon name="pin" size={13} className="text-accent" /> : row.hasVars ? <Icon name="braces" size={13} className="text-accent" /> : undefined,
      run: () => void navigate({ to: '/b/$boxId/t/$tabId/c/$cardId', params: { boxId: row.boxId, tabId: row.tabId, cardId: row.id } }),
      copy: () => {
        void copyCardById(row.boxId, row.id).then((card) => {
          if (card) onNeedsFill(card.boxId, card.id);
        });
      },
    }));
  }, [mode, needle, commands, tags, boxes, index, rows, boxNames, q, navigate, t, onNeedsFill]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (item: Item | undefined, copy: boolean) => {
    if (!item) return;
    close();
    if (copy && item.copy) item.copy();
    else item.run();
  };

  const hint = mode === 'commands' ? t('palette.modeCommands') : mode === 'tags' ? t('palette.modeTags') : mode === 'boxes' ? t('palette.modeBoxes') : t('palette.modeSearch');

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <DialogPrimitive.Content className="panel fixed top-[12vh] left-1/2 z-50 flex max-h-[70dvh] w-[calc(100%-24px)] max-w-[640px] -translate-x-1/2 flex-col overflow-hidden outline-none slide-up" aria-label={t('shortcuts.palette')}>
          <DialogPrimitive.Title className="sr-only">{t('shortcuts.palette')}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t('palette.hints', { mod: modKey })}</DialogPrimitive.Description>
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Icon name={mode === 'commands' ? 'terminal' : mode === 'tags' ? 'hash' : mode === 'boxes' ? 'box' : 'search'} size={16} className="text-accent" />
            <input
              ref={inputRef}
              className="h-12 min-w-0 flex-1 bg-transparent text-[1.02em] outline-none placeholder:text-dim"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('palette.placeholder')}
              aria-label={t('palette.placeholder')}
              aria-activedescendant={items[active] ? `pal-${items[active]!.key}` : undefined}
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, items.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  choose(items[active], e.ctrlKey || e.metaKey);
                } else if (e.key === 'Tab' && items[active] && mode !== 'search') {
                  e.preventDefault();
                  items[active]!.run();
                }
              }}
            />
            <span className="rounded-[6px] bg-surface2 px-1.5 py-0.5 text-[0.75em] tracking-wide text-dim uppercase">{hint}</span>
          </div>
          <div ref={listRef} id="palette-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <div className="px-3 py-8 text-center text-[0.95em] text-dim">{t('palette.noResults')}</div>
            ) : (
              items.map((item, i) => (
                <div
                  key={item.key}
                  id={`pal-${item.key}`}
                  data-i={i}
                  role="option"
                  aria-selected={i === active}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 ${i === active ? 'bg-accent-soft text-text' : 'text-muted'}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => choose(item, e.ctrlKey || e.metaKey)}
                >
                  <span className="flex w-6 shrink-0 items-center justify-center">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-text">{item.title}</span>
                    {item.subtitle ? <span className="block truncate text-[0.82em] text-dim">{item.subtitle}</span> : null}
                  </span>
                  {item.trailing}
                  {i === active && item.copy ? (
                    <span className="hidden items-center gap-1 text-[0.75em] text-dim sm:flex">
                      <Kbd>{modKey}</Kbd>
                      <Kbd>Enter</Kbd> {t('palette.copyAction')}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-line px-3 py-1.5 text-[0.78em] text-dim">
            <span>{t('palette.hints', { mod: modKey })}</span>
            {mode === 'search' && needle ? (
              <button type="button" className="ml-auto text-accent hover:underline" onClick={() => {
                close();
                void navigate({ to: '/search', search: { q } });
              }}>
                {t('palette.showAll')}
              </button>
            ) : lastBoxId && mode === 'search' ? (
              <span className="ml-auto">{t('palette.resultsFrom')}</span>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
