import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { detectImport, readFileText, runBoxyImport, runLegacyImport, type Detected } from '@/app/backup';
import { toast } from '@/app/ui-store';
import type { MigrationLog } from '@/data/types';
import { Icon } from '@/components/ui/Icon';
import { Button, Field, Spinner, Switch } from '@/components/ui/primitives';

export const LEGACY_URL = 'https://sadidft.github.io/boxy/';

export interface ImportPanelProps {
  /** Pre-loaded text (handoff or onboarding) skips the drop zone. */
  initialText?: string;
  source?: string;
  kind?: MigrationLog['kind'];
  onDone?: (log: MigrationLog) => void;
  compact?: boolean;
}

export function ImportPanel({ initialText, source = 'file', kind, onDone, compact }: ImportPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [fileName, setFileName] = useState<string>(source);
  const [reading, setReading] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [tables, setTables] = useState<'split' | 'inline'>('split');
  const [skipSamples, setSkipSamples] = useState(true);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<MigrationLog | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = async (text: string, name: string) => {
    setReading(true);
    setLog(null);
    try {
      const d = await detectImport(text);
      setDetected(d);
      setFileName(name);
    } finally {
      setReading(false);
    }
  };

  useEffect(() => {
    if (initialText) void load(initialText, source);
  }, [initialText, source]);

  const onFiles = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const text = await readFileText(f);
    await load(text, f.name);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void onFiles(e.dataTransfer.files);
  };

  const run = async () => {
    if (!detected || detected.kind === 'invalid' || busy) return;
    setBusy(true);
    try {
      let result: MigrationLog;
      if (detected.kind === 'legacy') {
        const r = await runLegacyImport(detected.parsed, { tables, skipSamples }, kind ?? (source === 'handoff' ? 'legacy-handoff' : 'legacy-file'), fileName);
        result = r.log;
      } else {
        result = await runBoxyImport(detected.data, mode, fileName);
      }
      setLog(result);
      toast(t('import.done'), { kind: 'success' });
      onDone?.(result);
    } catch (e) {
      toast(e instanceof Error ? e.message : t('errors.generic'), { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const counts = detected?.kind === 'legacy' ? { boxes: detected.parsed.boxes.length, tabs: detected.parsed.tabs.length, cards: detected.parsed.cards.length } : detected?.kind === 'boxy' ? detected.preview.counts : null;
  const warnings = detected?.kind === 'legacy' ? detected.parsed.warnings : detected?.kind === 'boxy' ? detected.preview.warnings : [];
  const sourceLabel = detected?.kind === 'legacy' ? t(detected.parsed.source === 'file-full' ? 'import.sourceFileFull' : detected.parsed.source === 'file-box' ? 'import.sourceFileBox' : detected.parsed.source === 'storage' ? 'import.sourceStorage' : 'import.sourceMinimal') : detected?.kind === 'boxy' ? t('import.sourceBoxy2') : '';

  if (log) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-control border border-accent/40 bg-accent-soft/40 p-3 text-text">
          <Icon name="check-circle-2" size={18} className="text-accent" />
          <div>
            <div className="font-semibold">{t('import.done')}</div>
            <div className="text-[0.9em] text-muted">{t('import.doneDetail', { cards: log.counts.cards ?? 0 })}</div>
          </div>
        </div>
        <ul className="space-y-1 text-[0.9em] text-muted">
          {log.counts.tablesSplit ? <li>{t('import.tablesSplitCount', { count: log.counts.tablesSplit })}</li> : null}
          {log.counts.historyTablesDropped ? <li>{t('import.historyDropped', { count: log.counts.historyTablesDropped })}</li> : null}
          {log.counts.orphansRecovered ? <li>{t('import.orphans', { count: log.counts.orphansRecovered })}</li> : null}
          {log.counts.sampleSkipped ? <li>{t('import.samplesSkipped', { count: log.counts.sampleSkipped })}</li> : null}
          {log.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
        {!onDone ? (
          <Button variant="primary" icon="arrow-right" onClick={() => void navigate({ to: '/' })}>
            {t('settings.backToApp')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!initialText ? (
        <>
          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-accent bg-accent-soft/40' : 'border-line-strong'} ${compact ? 'py-4' : 'py-8'}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Icon name="file-json" size={28} className="text-accent" />
            <p className="text-[0.95em] text-muted">{t('import.dropHint')}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="primary" icon="folder-open" onClick={() => fileRef.current?.click()}>
                {t('import.choose')}
              </Button>
              <Button icon="clipboard-paste" onClick={() => setPasteOpen((o) => !o)}>
                {t('import.pasteJson')}
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="application/json,.json,text/plain" className="sr-only" onChange={(e) => void onFiles(e.target.files)} />
            <p className="text-[0.8em] text-dim">{t('import.formats')}</p>
          </div>
          {pasteOpen ? (
            <div className="space-y-2">
              <textarea className="textarea font-ui text-[0.85em]" rows={5} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={t('import.pasteJsonPlaceholder')} aria-label={t('import.pasteJson')} />
              <Button size="sm" onClick={() => void load(pasteText, 'paste')} disabled={!pasteText.trim()}>
                {t('import.readPaste')}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {reading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner /> {t('import.reading')}
        </div>
      ) : null}

      {detected?.kind === 'invalid' ? (
        <div className="flex items-start gap-2 rounded-control border border-danger/40 bg-danger/10 p-3 text-[0.95em]">
          <Icon name="alert-triangle" size={16} className="mt-0.5 text-danger" />
          <div>
            <div className="font-semibold">{t('import.invalid')}</div>
            {detected.reason && detected.reason !== 'json' && detected.reason !== 'unknown' ? <div className="text-muted">{detected.reason}</div> : null}
          </div>
        </div>
      ) : null}

      {detected && detected.kind !== 'invalid' && counts ? (
        <div className="space-y-3 rounded-card border border-line bg-surface p-3">
          <div>
            <div className="text-[0.8em] font-semibold tracking-wide text-dim uppercase">{t('import.previewTitle')}</div>
            <div className="mt-0.5 font-semibold">{sourceLabel}</div>
            <div className="text-[0.95em] text-muted">
              {t('import.counts', counts)} <span className="text-dim">({fileName})</span>
            </div>
          </div>
          {warnings.length ? (
            <div className="rounded-control border border-label-amber/40 bg-label-amber/10 p-2 text-[0.9em]">
              <div className="mb-1 font-semibold">{t('import.warnings')}</div>
              <ul className="list-disc space-y-0.5 pl-4 text-muted">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {detected.kind === 'legacy' ? (
            <>
              <Field label={t('import.tablesTitle')}>
                <div className="space-y-1.5 text-[0.95em]">
                  <label className="flex items-start gap-2">
                    <input type="radio" name="tables" className="mt-1 accent-[var(--accent)]" checked={tables === 'split'} onChange={() => setTables('split')} />
                    <span>{t('import.tablesSplit')}</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="radio" name="tables" className="mt-1 accent-[var(--accent)]" checked={tables === 'inline'} onChange={() => setTables('inline')} />
                    <span>{t('import.tablesInline')}</span>
                  </label>
                </div>
              </Field>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.95em]">{t('import.skipSamples')}</span>
                <Switch checked={skipSamples} onCheckedChange={setSkipSamples} label={t('import.skipSamples')} />
              </div>
            </>
          ) : (
            <Field label={t('import.mode')}>
              <div className="space-y-1.5 text-[0.95em]">
                <label className="flex items-start gap-2">
                  <input type="radio" name="mode" className="mt-1 accent-[var(--accent)]" checked={mode === 'merge'} onChange={() => setMode('merge')} />
                  <span>{t('import.merge')}</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="radio" name="mode" className="mt-1 accent-[var(--accent)]" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                  <span>
                    {t('import.replace')}
                    <span className="block text-[0.85em] text-dim">{t('import.replaceWarning')}</span>
                  </span>
                </label>
              </div>
            </Field>
          )}
          <div className="flex justify-end">
            <Button variant="primary" icon="download" onClick={() => void run()} disabled={busy}>
              {busy ? t('import.importing') : t('import.importButton')}
            </Button>
          </div>
        </div>
      ) : null}

      {!initialText && !compact ? (
        <p className="text-[0.85em] text-dim">
          {t('storage.legacyHandoffDesc')}{' '}
          <a className="text-accent hover:underline" href={LEGACY_URL} target="_blank" rel="noopener noreferrer">
            {t('import.openLegacyLink')}
          </a>
        </p>
      ) : null}
    </div>
  );
}
