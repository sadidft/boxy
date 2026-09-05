import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from '@tanstack/react-router';
import { getDB } from '@/data/db';
import { newId } from '@/data/ids';
import { toast } from '@/app/ui-store';
import { Icon } from '@/components/ui/Icon';
import { Button, Spinner } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';
import { ImportPanel } from '@/components/import/ImportPanel';

/** Origins allowed to send legacy data. The env value lets e2e tests use a second local origin. */
export const LEGACY_ORIGINS: string[] = ['https://sadidft.github.io', ...(import.meta.env.VITE_LEGACY_ORIGIN ? String(import.meta.env.VITE_LEGACY_ORIGIN).split(',') : [])];
const MAX_BYTES = 25 * 1024 * 1024;

interface HandoffMessage {
  type: 'boxy-handoff-data';
  nonce: string;
  payload: { primary?: string | null; backup?: string | null };
  sentAt?: number;
}

export function HandoffPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nonce = useMemo(() => newId(), []);
  const [status, setStatus] = useState<'waiting' | 'received' | 'empty'>('waiting');
  const pending = useLiveQuery(() => getDB().handoff.where('imported').equals(0).reverse().sortBy('receivedAt'), []);
  const latest = pending?.[0];

  useEffect(() => {
    const opener = window.opener as Window | null;
    const onMessage = async (event: MessageEvent<HandoffMessage>) => {
      if (!LEGACY_ORIGINS.includes(event.origin)) {
        toast(t('import.handoffRejected'), { kind: 'error' });
        return;
      }
      const msg = event.data;
      if (!msg || msg.type !== 'boxy-handoff-data' || msg.nonce !== nonce) return;
      const primary = typeof msg.payload?.primary === 'string' ? msg.payload.primary : null;
      const backup = typeof msg.payload?.backup === 'string' ? msg.payload.backup : null;
      const size = (primary?.length ?? 0) + (backup?.length ?? 0);
      if (!primary && !backup) {
        setStatus('empty');
        return;
      }
      if (size > MAX_BYTES) {
        toast(t('errors.quota'), { kind: 'error' });
        return;
      }
      let counts: Record<string, number> = {};
      try {
        const parsed = JSON.parse(primary ?? backup ?? '{}') as { boxes?: unknown[]; tabs?: unknown[]; cards?: unknown[]; _version?: string; version?: string };
        counts = { boxes: parsed.boxes?.length ?? 0, tabs: parsed.tabs?.length ?? 0, cards: parsed.cards?.length ?? 0 };
      } catch {
        toast(t('import.invalid'), { kind: 'error' });
        return;
      }
      await getDB().handoff.put({ id: newId(), receivedAt: Date.now(), origin: event.origin, primary, backup, imported: 0 });
      (event.source as Window | null)?.postMessage({ type: 'boxy-handoff-received', nonce, counts }, event.origin);
      setStatus('received');
      toast(t('import.handoffReceived', { origin: event.origin }), { kind: 'success' });
    };
    const handler = (e: MessageEvent) => void onMessage(e);
    window.addEventListener('message', handler);
    if (opener) {
      for (const origin of LEGACY_ORIGINS) {
        try {
          opener.postMessage({ type: 'boxy-handoff-ready', nonce }, origin);
        } catch {
          // opener may be closed
        }
      }
    }
    return () => window.removeEventListener('message', handler);
  }, [nonce, t]);

  const text = latest ? (latest.primary ?? latest.backup ?? undefined) : undefined;

  return (
    <div className="flex h-full flex-col">
      <PageHeader icon="arrow-down-to-line" title={t('import.handoffTitle')} />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto max-w-2xl space-y-4">
          {!latest ? (
            <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
              {status === 'waiting' ? <Spinner /> : <Icon name="info" size={18} className="text-muted" />}
              <div>
                <div className="font-semibold">{status === 'empty' ? t('import.handoffEmpty') : t('import.handoffWaiting')}</div>
                <div className="text-[0.9em] text-muted">{t('import.handoffWaitingHint')}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-card border border-accent/40 bg-accent-soft/30 p-3">
                <Icon name="check-circle-2" size={18} className="text-accent" />
                <div className="text-[0.95em]">
                  {t('import.handoffReceived', { origin: latest.origin })}
                  <div className="text-[0.85em] text-muted">{t('import.handoffClose')}</div>
                </div>
              </div>
              <ImportPanel
                key={latest.id}
                initialText={text}
                source="handoff"
                kind="legacy-handoff"
                onDone={() => {
                  void getDB().handoff.update(latest.id, { imported: 1 });
                }}
              />
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => void navigate({ to: '/' })}>
                  {t('settings.backToApp')}
                </Button>
              </div>
            </>
          )}
          {!latest ? (
            <details className="rounded-card border border-line bg-surface p-3 text-[0.9em]">
              <summary className="cursor-pointer font-semibold">{t('storage.legacyImportFile')}</summary>
              <div className="mt-3">
                <ImportPanel compact />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
