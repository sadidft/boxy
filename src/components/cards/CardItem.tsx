import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card, TableBody, TextBody } from '@/data/types';
import { renderMarkdown } from '@/core/markdown';
import { tableToRows } from '@/core/copy';
import { hasDynamicContent } from '@/core/template';
import { Icon } from '@/components/ui/Icon';
import { Menu, type MenuItemSpec } from '@/components/ui/primitives';
import { useFormat } from '@/hooks/format';

export interface CardItemProps {
  card: Card;
  selected: boolean;
  view: 'grid' | 'list' | 'masonry';
  onOpen: () => void;
  onCopy: () => void;
  onSelect: () => void;
  menuItems: MenuItemSpec[];
  copyMenuItems: MenuItemSpec[];
}

function TypeBadge({ type }: { type: Card['type'] }) {
  const cls = type === 'table' ? 'bg-label-amber' : 'bg-label-mint';
  return (
    <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] text-[var(--bg)] ${cls}`} aria-hidden="true">
      <Icon name={type === 'table' ? 'table' : 'file-text'} size={13} strokeWidth={2.4} />
    </span>
  );
}

export function TablePreview({ body, maxRows = 5 }: { body: TableBody; maxRows?: number }) {
  const { t } = useTranslation();
  const { header, rows, footer } = useMemo(() => tableToRows(body), [body]);
  if (!header.length) return <p className="text-dim">{t('cards.noColumns')}</p>;
  return (
    <table className="w-full border-collapse text-[0.92em]">
      <thead>
        <tr>
          {header.map((h, i) => (
            <th key={i} className="border-b border-line px-1.5 py-1 text-left text-[0.85em] font-semibold tracking-wide text-dim uppercase">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, maxRows).map((r, ri) => (
          <tr key={ri}>
            {r.map((c, ci) => (
              <td key={ci} className="border-b border-line px-1.5 py-1 text-muted">
                {c}
              </td>
            ))}
          </tr>
        ))}
        {rows.length > maxRows ? (
          <tr>
            <td colSpan={header.length} className="px-1.5 py-1 text-[0.85em] text-dim">
              +{rows.length - maxRows}
            </td>
          </tr>
        ) : null}
        {footer ? (
          <tr>
            {footer.map((f, i) => (
              <td key={i} className="px-1.5 py-1 font-semibold text-accent">
                {f}
                {body.footer[body.columns[i]?.id ?? ''] ? <small className="block font-ui text-[0.8em] font-normal text-dim">{body.footer[body.columns[i]!.id]}</small> : null}
              </td>
            ))}
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

export const CardItem = memo(function CardItem({ card, selected, view, onOpen, onCopy, onSelect, menuItems, copyMenuItems }: CardItemProps) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const isText = card.type === 'text';
  const md = isText ? (card.body as TextBody).md : '';
  const html = useMemo(() => (isText ? renderMarkdown(md) : ''), [isText, md]);
  const dynamic = isText && hasDynamicContent(md);
  const list = view === 'list';

  return (
    <article
      className={`card ${list ? 'flex-row items-stretch' : ''}`}
      data-pinned={card.pinned ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      data-card-id={card.id}
      tabIndex={0}
      aria-label={card.title || t('common.untitled')}
      onFocus={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={`flex min-w-0 flex-1 flex-col ${list ? 'flex-row items-center gap-3 px-3 py-2' : ''}`}>
        <header className={`flex items-center gap-2 ${list ? 'w-[260px] shrink-0' : 'px-[var(--card-pad)] pt-2.5 pb-1.5'}`}>
          <TypeBadge type={card.type} />
          <h3 className="min-w-0 flex-1 truncate font-semibold">{card.title || <span className="text-dim">{t('common.untitled')}</span>}</h3>
          {card.label ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(--label-${card.label})` }} aria-label={t(`cards.labels.${card.label}`)} /> : null}
          {card.quickSlot ? <span className="rounded-[4px] border border-line-strong px-1 text-[10px] leading-4 text-accent">{card.quickSlot}</span> : null}
        </header>
        {list ? (
          <p className="min-w-0 flex-1 truncate text-[0.95em] text-muted">{isText ? md.replace(/\s+/g, ' ').slice(0, 200) : `${(card.body as TableBody).columns.map((c) => c.name).join(' | ')}`}</p>
        ) : (
          <div className={`reading min-h-0 px-[var(--card-pad)] pb-2 text-[0.95em] leading-relaxed text-muted ${view === 'grid' ? 'max-h-[220px] overflow-hidden' : ''}`} onClick={onSelect}>
            {isText ? (
              md.trim() ? (
                <div className={`md ${view === 'grid' ? 'clamp' : ''}`} style={{ ['--clamp' as string]: 8 }} dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <p className="text-dim">{t('cards.emptyText')}</p>
              )
            ) : (
              <TablePreview body={card.body as TableBody} />
            )}
          </div>
        )}
        {!list && card.tags.length ? (
          <div className="flex flex-wrap gap-1 px-[var(--card-pad)] pb-2">
            {card.tags.map((tag) => (
              <span key={tag} className="chip" style={{ paddingInline: 7, fontSize: '0.8em' }}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        <footer className={`flex items-center gap-1 ${list ? 'shrink-0' : 'mt-auto border-t border-line px-2.5 py-2'}`}>
          <div className="inline-flex h-[26px] shrink-0 overflow-hidden rounded-[7px] border border-accent/40">
            <button type="button" className="flex items-center gap-1.5 px-2.5 text-[0.9em] font-semibold whitespace-nowrap text-accent hover:bg-accent-soft" onClick={onCopy} aria-label={`${dynamic ? t('cards.fillAndCopy') : t('cards.copy')}: ${card.title}`}>
              <Icon name={dynamic ? 'braces' : 'copy'} size={13} />
              {dynamic ? t('cards.fillAndCopy') : t('cards.copy')}
            </button>
            <Menu
              label={t('cards.copyAs')}
              trigger={
                <button type="button" className="flex w-6 items-center justify-center border-l border-accent/40 text-accent hover:bg-accent-soft" aria-label={t('cards.copyAs')}>
                  <Icon name="chevron-down" size={12} />
                </button>
              }
              items={copyMenuItems}
            />
          </div>
          <button type="button" className="icon-btn shrink-0" style={{ width: 26, height: 26 }} aria-label={t('common.edit')} onClick={onOpen}>
            <Icon name="pencil" size={13} />
          </button>
          <Menu
            label={t('common.more')}
            trigger={
              <button type="button" className="icon-btn shrink-0" style={{ width: 26, height: 26 }} aria-label={t('common.more')}>
                <Icon name="ellipsis" size={14} />
              </button>
            }
            items={menuItems}
          />
          <span className="ml-auto min-w-0 truncate text-[0.8em] text-dim" title={card.stats.lastCopiedAt ? fmt.dateTime(card.stats.lastCopiedAt) : undefined}>
            {card.stats.copyCount ? `${t('cards.copies', { count: card.stats.copyCount })} ` : ''}
            {card.stats.lastCopiedAt ? fmt.relative(card.stats.lastCopiedAt) : t('cards.edited', { when: fmt.relative(card.updatedAt) })}
          </span>
        </footer>
      </div>
    </article>
  );
});
