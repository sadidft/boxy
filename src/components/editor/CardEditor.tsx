import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card, LabelColor, TableBody, TextBody } from '@/data/types';
import { updateCard } from '@/data/repo/cards';
import { renderMarkdown } from '@/core/markdown';
import { parseTemplate } from '@/core/template';
import { copyCard, needsFill } from '@/app/actions';
import { labelColors } from '@/styles/tokens';
import { useAllTags } from '@/hooks/data';
import { useFormat } from '@/hooks/format';
import { Icon } from '@/components/ui/Icon';
import { Button, IconButton, Menu, Tooltip, type MenuItemSpec } from '@/components/ui/primitives';
import { TableEditor } from './TableEditor';

const AUTOSAVE_MS = 500;

export interface CardEditorProps {
  card: Card;
  onClose: () => void;
  onNeedsFill: (card: Card) => void;
  fullscreen?: boolean;
}

interface Draft {
  title: string;
  md: string;
  table: TableBody;
  tags: string[];
}

const draftOf = (card: Card): Draft => ({
  title: card.title,
  md: card.type === 'text' ? (card.body as TextBody).md : '',
  table: card.type === 'table' ? (card.body as TableBody) : { columns: [], rows: [], footer: {} },
  tags: card.tags,
});

const BUILTIN_SNIPPETS: { key: string; snippet: string }[] = [
  { key: 'builtinCustom', snippet: '{{name}}' },
  { key: 'builtinDate', snippet: '{{date}}' },
  { key: 'builtinTime', snippet: '{{time}}' },
  { key: 'builtinDatetime', snippet: '{{datetime}}' },
  { key: 'builtinWeekday', snippet: '{{weekday}}' },
  { key: 'builtinMonth', snippet: '{{month}}' },
  { key: 'builtinYear', snippet: '{{year}}' },
  { key: 'builtinRandom', snippet: '{{random}}' },
  { key: 'builtinUuid', snippet: '{{uuid}}' },
  { key: 'builtinClipboard', snippet: '{{clipboard}}' },
  { key: 'builtinCounter', snippet: '{{counter:invoice}}' },
  { key: 'builtinGlobal', snippet: '{{global:signature}}' },
];

export function CardEditor({ card, onClose, onNeedsFill, fullscreen }: CardEditorProps) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const [draft, setDraft] = useState<Draft>(() => draftOf(card));
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [status, setStatus] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [tagInput, setTagInput] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(draft);
  const lastSaved = useRef(draftOf(card));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const allTags = useAllTags();
  latest.current = draft;

  // Reset when a different card opens.
  useEffect(() => {
    const d = draftOf(card);
    setDraft(d);
    lastSaved.current = d;
    setStatus('saved');
    setMode('write');
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(async () => {
    const d = latest.current;
    const prev = lastSaved.current;
    if (d.title === prev.title && d.md === prev.md && d.table === prev.table && d.tags === prev.tags) {
      setStatus('saved');
      return;
    }
    setStatus('saving');
    await updateCard(card.boxId, card.id, {
      title: d.title,
      tags: d.tags,
      body: card.type === 'text' ? { md: d.md } : d.table,
    });
    lastSaved.current = d;
    setStatus('saved');
  }, [card.boxId, card.id, card.type]);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return persist();
  }, [persist]);

  const change = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), AUTOSAVE_MS);
  };

  // Flush on hide/unmount so nothing is lost when the tab closes or the SW reloads.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      void flush();
    };
  }, [flush]);

  const parsed = useMemo(() => (card.type === 'text' ? parseTemplate(draft.md) : null), [card.type, draft.md]);
  const previewHtml = useMemo(() => (mode === 'preview' ? renderMarkdown(draft.md) : ''), [mode, draft.md]);

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      change({ md: draft.md + snippet });
      return;
    }
    const start = el.selectionStart ?? draft.md.length;
    const end = el.selectionEnd ?? start;
    const next = draft.md.slice(0, start) + snippet + draft.md.slice(end);
    change({ md: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').replace(/,+$/, '');
    if (!tag) return;
    if (draft.tags.some((x) => x.toLowerCase() === tag.toLowerCase())) return;
    change({ tags: [...draft.tags, tag] });
    setTagInput('');
  };

  const copyNow = async () => {
    await flush();
    const current: Card = { ...card, title: draft.title, tags: draft.tags, body: card.type === 'text' ? { md: draft.md } : draft.table };
    if (needsFill(current)) onNeedsFill(current);
    else await copyCard(current);
  };

  const labelMenu: MenuItemSpec[] = [
    { id: 'none', label: t('cards.noLabel'), checked: !card.label, onSelect: () => void updateCard(card.boxId, card.id, { label: null }) },
    ...labelColors.map((c) => ({ id: c, label: t(`cards.labels.${c}`), checked: card.label === c, onSelect: () => void updateCard(card.boxId, card.id, { label: c as LabelColor }) })),
  ];

  return (
    <div className={`flex h-full flex-col bg-surface ${fullscreen ? '' : 'border-l border-line'}`} onKeyDown={(e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void copyNow();
      }
    }}>
      <header className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <IconButton icon={fullscreen ? 'arrow-left' : 'x'} label={t('editor.closeEditor')} onClick={() => void flush().then(onClose)} />
        <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[var(--bg)] ${card.type === 'table' ? 'bg-label-amber' : 'bg-label-mint'}`} aria-hidden="true">
          <Icon name={card.type === 'table' ? 'table' : 'file-text'} size={13} strokeWidth={2.4} />
        </span>
        <span className="text-[0.85em] text-dim">{t(card.type === 'table' ? 'cards.typeTable' : 'cards.typeText')}</span>
        <span className="ml-auto text-[0.8em] text-dim" aria-live="polite">
          {status === 'saved' ? t('editor.saved') : t('editor.saving')}
        </span>
        <Tooltip label={t('cards.label')}>
          <span>
            <Menu label={t('cards.label')} trigger={<button type="button" className="icon-btn" aria-label={t('cards.label')}><span className="h-3 w-3 rounded-full border border-line-strong" style={card.label ? { background: `var(--label-${card.label})`, borderColor: 'transparent' } : undefined} /></button>} items={labelMenu} />
          </span>
        </Tooltip>
        <IconButton icon={card.pinned ? 'pin-off' : 'pin'} label={card.pinned ? t('cards.unpin') : t('cards.pin')} active={card.pinned} onClick={() => void updateCard(card.boxId, card.id, { pinned: !card.pinned })} />
        <Button variant="primary" size="sm" icon="copy" onClick={() => void copyNow()}>
          {t('cards.copy')}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <input className="w-full bg-transparent text-[1.15em] font-semibold outline-none placeholder:text-dim" value={draft.title} onChange={(e) => change({ title: e.target.value })} placeholder={t('editor.titlePlaceholder')} aria-label={t('editor.titlePlaceholder')} maxLength={200} />

        {card.type === 'text' ? (
          <>
            <div className="flex flex-wrap items-center gap-1">
              <div className="seg">
                <button type="button" aria-pressed={mode === 'write'} onClick={() => setMode('write')}>
                  <Icon name="pencil" size={13} /> {t('editor.write')}
                </button>
                <button type="button" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>
                  <Icon name="eye" size={13} /> {t('editor.preview')}
                </button>
              </div>
              <Menu
                label={t('editor.insertVariable')}
                trigger={
                  <button type="button" className="btn btn-sm btn-ghost">
                    <Icon name="braces" size={14} /> {t('editor.insertVariable')}
                  </button>
                }
                items={BUILTIN_SNIPPETS.map((s) => ({ id: s.key, label: `${t(`editor.${s.key}`)}  ${s.snippet}`, onSelect: () => insertAtCursor(s.snippet) }))}
                align="start"
              />
              <span className="ml-auto text-[0.8em] text-dim">{t('editor.chars', { count: draft.md.length })}</span>
            </div>
            {mode === 'write' ? (
              <textarea
                ref={textareaRef}
                className="textarea reading min-h-[240px] flex-1 resize-none font-ui leading-relaxed"
                value={draft.md}
                onChange={(e) => change({ md: e.target.value })}
                placeholder={t('editor.bodyPlaceholder')}
                aria-label={t('editor.bodyPlaceholder')}
                spellCheck
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    insertAtCursor('  ');
                  }
                }}
              />
            ) : (
              <div className="md reading min-h-[240px] flex-1 rounded-control border border-line bg-bg p-3 text-[0.98em] leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}
            {parsed && (parsed.vars.length || parsed.counters.length || parsed.globals.length || parsed.usesClipboard) ? (
              <div className="flex flex-wrap items-center gap-1 text-[0.85em]">
                <span className="text-dim">{t('editor.variablesDetected')}:</span>
                {parsed.vars.map((v) => (
                  <span key={v.name} className="var">
                    {v.name}
                    {v.choices ? ` (${v.choices.join('/')})` : ''}
                  </span>
                ))}
                {parsed.counters.map((c) => (
                  <span key={`c-${c}`} className="var">
                    counter:{c}
                  </span>
                ))}
                {parsed.globals.map((g) => (
                  <span key={`g-${g}`} className="var">
                    global:{g}
                  </span>
                ))}
                {parsed.usesClipboard ? <span className="var">clipboard</span> : null}
              </div>
            ) : null}
          </>
        ) : (
          <TableEditor value={draft.table} onChange={(table) => change({ table })} />
        )}

        <div>
          <div className="mb-1 text-[0.8em] font-semibold tracking-wide text-dim uppercase">{t('editor.tags')}</div>
          <div className="flex flex-wrap items-center gap-1 rounded-control border border-line-strong bg-surface px-2 py-1 focus-within:border-accent">
            {draft.tags.map((tag) => (
              <span key={tag} className="chip" data-on="true">
                #{tag}
                <button type="button" aria-label={`${t('common.remove')} ${tag}`} onClick={() => change({ tags: draft.tags.filter((x) => x !== tag) })} className="ml-0.5 text-accent/70 hover:text-accent">
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
            <input
              className="h-6 min-w-[120px] flex-1 bg-transparent text-[0.95em] outline-none placeholder:text-dim"
              value={tagInput}
              list="all-tags"
              onChange={(e) => {
                const v = e.target.value;
                if (v.endsWith(',') || v.endsWith(' ')) addTag(v);
                else setTagInput(v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagInput);
                } else if (e.key === 'Backspace' && !tagInput && draft.tags.length) change({ tags: draft.tags.slice(0, -1) });
              }}
              onBlur={() => addTag(tagInput)}
              placeholder={t('editor.tagsPlaceholder')}
              aria-label={t('editor.tags')}
            />
            <datalist id="all-tags">{allTags?.slice(0, 50).map((x) => <option key={x.tag} value={x.tag} />)}</datalist>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-[0.8em] text-dim">
          <span>{t('editor.created', { when: fmt.dateTime(card.createdAt) })}</span>
          <span>{t('editor.updated', { when: fmt.relative(card.updatedAt) })}</span>
          <span>{card.stats.copyCount ? t('cards.copies', { count: card.stats.copyCount }) : t('cards.neverCopied')}</span>
          <span className="ml-auto">{t('editor.shortcuts')}</span>
        </div>
      </div>
    </div>
  );
}
