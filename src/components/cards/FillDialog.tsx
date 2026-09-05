import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card, TextBody } from '@/data/types';
import { parseTemplate, renderTemplate } from '@/core/template';
import { copyCard, loadTemplateContext, type TemplateContextData } from '@/app/actions';
import { useSettings } from '@/app/settings-store';
import { Button, Dialog, Field } from '@/components/ui/primitives';

export function FillDialog({ card, onClose }: { card: Card | null; onClose: () => void }) {
  const { t } = useTranslation();
  const locale = useSettings((s) => s.locale);
  const md = card?.type === 'text' ? (card.body as TextBody).md : '';
  const parsed = useMemo(() => parseTemplate(md), [md]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [clipboard, setClipboard] = useState<string | undefined>(undefined);
  const [clipboardDenied, setClipboardDenied] = useState(false);
  const [ctx, setCtx] = useState<TemplateContextData>({ globals: {}, counters: {} });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!card) return;
    const initial: Record<string, string> = {};
    for (const v of parsed.vars) initial[v.name] = card.vars[v.name]?.last ?? v.defaultValue ?? v.choices?.[0] ?? '';
    setValues(initial);
    setClipboard(undefined);
    setClipboardDenied(false);
    void loadTemplateContext().then(setCtx);
    if (parsed.usesClipboard && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      navigator.clipboard
        .readText()
        .then((text) => setClipboard(text))
        .catch(() => setClipboardDenied(true));
    } else if (parsed.usesClipboard) setClipboardDenied(true);
  }, [card, parsed]);

  const preview = useMemo(() => {
    if (!card) return '';
    return renderTemplate(parsed, { now: new Date(), locale, values, globals: ctx.globals, counters: ctx.counters, clipboard: clipboard ?? '' }).text;
  }, [card, parsed, values, ctx, clipboard, locale]);

  const submit = async () => {
    if (!card || busy) return;
    setBusy(true);
    try {
      await copyCard(card, 'plain', values, clipboard ?? '');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={Boolean(card)}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={t('cards.fillTitle')}
      description={card?.title}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="copy" onClick={submit} disabled={busy}>
            {t('cards.copy')}
          </Button>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {parsed.vars.map((v, i) => (
          <Field key={v.name} label={v.name}>
            {v.choices ? (
              <select className="select w-full" value={values[v.name] ?? ''} onChange={(e) => setValues({ ...values, [v.name]: e.target.value })} autoFocus={i === 0}>
                {v.choices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input className="input" list={card?.vars[v.name]?.history.length ? `hist-${v.name}` : undefined} value={values[v.name] ?? ''} onChange={(e) => setValues({ ...values, [v.name]: e.target.value })} placeholder={v.defaultValue} autoFocus={i === 0} />
            )}
            {card?.vars[v.name]?.history.length ? (
              <datalist id={`hist-${v.name}`}>
                {card.vars[v.name]!.history.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            ) : null}
          </Field>
        ))}
        {parsed.usesClipboard && clipboardDenied ? (
          <Field label={t('cards.clipboardField')} hint={t('cards.clipboardNeeded')}>
            <textarea className="textarea" rows={3} value={clipboard ?? ''} onChange={(e) => setClipboard(e.target.value)} />
          </Field>
        ) : null}
        {parsed.counters.length ? <p className="text-[0.85em] text-dim">{parsed.counters.map((c) => t('cards.counterNote', { name: c })).join(' ')}</p> : null}
        <div>
          <div className="mb-1 text-[0.85em] font-semibold tracking-wide text-muted uppercase">{t('cards.preview')}</div>
          <pre className="reading max-h-60 overflow-auto rounded-control border border-line bg-bg p-2.5 text-[0.92em] leading-relaxed whitespace-pre-wrap text-text">{preview}</pre>
        </div>
        <p className="text-[0.8em] text-dim">{t('cards.fillHint')}</p>
      </form>
    </Dialog>
  );
}
