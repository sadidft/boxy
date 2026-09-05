import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from '@tanstack/react-router';
import { useUI } from '@/app/ui-store';
import type { BoxMeta, Tab } from '@/data/types';
import { Icon } from '@/components/ui/Icon';
import { Button, IconButton, Kbd, Tooltip } from '@/components/ui/primitives';
import { modKey } from '@/hooks/format';

export function Omnibar({ box, tab, onNewCard }: { box?: BoxMeta | null; tab?: Tab | null; onNewCard?: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useUI((s) => s.query);
  const setQuery = useUI((s) => s.setQuery);
  const openPalette = useUI((s) => s.openPalette);
  const online = useUI((s) => s.online);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.activeElement as HTMLElement | null;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-[var(--shell-omni)] items-center gap-2 border-b border-line px-3">
      <div className="hidden items-center gap-0.5 sm:flex">
        <IconButton icon="chevron-left" label={t('shell.navBack')} onClick={() => router.history.back()} />
        <IconButton icon="chevron-right" label={t('shell.navForward')} onClick={() => router.history.forward()} />
      </div>
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-2.5 focus-within:border-accent">
        <Icon name="search" size={15} className="shrink-0 text-muted" />
        {box ? (
          <div className="hidden shrink-0 items-center gap-1.5 text-[0.95em] font-semibold md:flex" aria-hidden="true">
            <span className="truncate">{box.name}</span>
            {tab ? (
              <>
                <span className="text-dim">/</span>
                <span className="truncate">{tab.name}</span>
              </>
            ) : null}
            <span className="mx-1 h-4 w-px bg-line-strong" />
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith('>') || v.startsWith('@')) {
              setQuery('');
              openPalette(v);
              return;
            }
            setQuery(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('');
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={tab ? t('shell.searchInTab') : t('shell.searchPlaceholder')}
          aria-label={t('common.search')}
          className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-dim"
          enterKeyHint="search"
        />
        <button type="button" className="hidden items-center gap-1 text-dim hover:text-text sm:flex" onClick={() => openPalette()} aria-label={t('shell.openInPalette')}>
          <Kbd>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </button>
      </div>
      <Tooltip label={online ? t('shell.localHint') : t('pwa.offline')}>
        <div className="hidden items-center gap-1.5 px-1 text-[0.85em] text-muted lg:flex" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-dim'}`} aria-hidden="true" />
          {online ? t('shell.local') : <Icon name="wifi-off" size={13} />}
        </div>
      </Tooltip>
      {onNewCard ? (
        <Button variant="primary" icon="plus" onClick={onNewCard} className="shrink-0">
          <span className="hidden sm:inline">{t('common.new')}</span>
          <span className="ml-0.5 hidden rounded-[4px] bg-black/15 px-1 text-[0.8em] sm:inline">N</span>
        </Button>
      ) : null}
    </div>
  );
}
