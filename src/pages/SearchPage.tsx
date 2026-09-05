import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDB } from '@/data/db';
import { useBoxes } from '@/hooks/data';
import { useFormat } from '@/hooks/format';
import { useShell } from '@/app/shell-context';
import { copyCardById } from '@/app/actions';
import { buildIndex, searchIndex } from '@/core/search';
import { Icon } from '@/components/ui/Icon';
import { Button, EmptyState } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';

export function SearchPage({ initialQuery }: { initialQuery: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fmt = useFormat();
  const shell = useShell();
  const [q, setQ] = useState(initialQuery);
  useEffect(() => setQ(initialQuery), [initialQuery]);
  const rows = useLiveQuery(() => getDB().cards_index.toArray(), []);
  const boxes = useBoxes(true);
  const boxNames = useMemo(() => new Map((boxes ?? []).map((b) => [b.id, b.name])), [boxes]);
  const index = useMemo(() => (rows && rows.length ? buildIndex(rows) : null), [rows]);
  const hits = useMemo(() => (rows ? searchIndex(index, rows, boxNames, q, 200) : []), [rows, index, boxNames, q]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader icon="search" title={t('shell.navSearch')} subtitle={t('palette.resultsFrom')} />
      <div className="border-b border-line p-3">
        <div className="mx-auto flex h-10 max-w-3xl items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 focus-within:border-accent">
          <Icon name="search" size={16} className="text-muted" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-dim"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              void navigate({ to: '/search', search: { q: e.target.value }, replace: true });
            }}
            placeholder={t('shell.searchPlaceholder')}
            aria-label={t('common.search')}
            autoFocus
          />
          {q ? (
            <button type="button" className="text-dim hover:text-text" onClick={() => setQ('')} aria-label={t('common.clear')}>
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mx-auto max-w-3xl">
          {rows && hits.length === 0 ? (
            <div className="py-10">
              <EmptyState icon="search-x" title={q ? t('shell.noResults', { query: q }) : t('palette.noResults')} />
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {hits.map(({ row }) => (
                <li key={row.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2 hover:border-line-strong">
                  <Icon name={row.type === 'table' ? 'table' : 'file-text'} size={16} className={row.type === 'table' ? 'text-label-amber' : 'text-label-mint'} />
                  <Link to="/b/$boxId/t/$tabId/c/$cardId" params={{ boxId: row.boxId, tabId: row.tabId, cardId: row.id }} className="min-w-0 flex-1 outline-none focus-visible:underline">
                    <div className="truncate font-semibold">{row.title || t('common.untitled')}</div>
                    <div className="truncate text-[0.85em] text-dim">
                      {boxNames.get(row.boxId)} · {row.preview.replace(/\s+/g, ' ').slice(0, 120)}
                    </div>
                  </Link>
                  <span className="hidden text-[0.8em] text-dim sm:block">{row.copyCount ? `${row.copyCount}x · ${fmt.relative(row.lastCopiedAt)}` : ''}</span>
                  <Button
                    size="sm"
                    variant="accent"
                    icon={row.hasVars ? 'braces' : 'copy'}
                    onClick={() => {
                      void copyCardById(row.boxId, row.id).then((card) => {
                        if (card) shell.openFillById(card.boxId, card.id);
                      });
                    }}
                  >
                    {t('cards.copy')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
