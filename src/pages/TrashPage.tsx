import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrash } from '@/hooks/data';
import { useFormat } from '@/hooks/format';
import { purge, restore, TRASH_RETENTION_MS } from '@/data/repo/trash';
import { getDB } from '@/data/db';
import { toast } from '@/app/ui-store';
import type { TrashItem } from '@/data/types';
import { Icon } from '@/components/ui/Icon';
import { Button, Dialog, EmptyState } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';

export function TrashPage() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const items = useTrash();
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const doRestore = async (item: TrashItem) => {
    setBusy(item.id);
    try {
      await restore(item.id);
      toast(t('trash.restored', { name: item.label }), { kind: 'success' });
    } catch (e) {
      toast(e instanceof Error && e.name === 'BoxyError' ? t('trash.parentMissing') : t('errors.generic'), { kind: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const doPurge = async (item: TrashItem) => {
    await purge(item.id);
    toast(t('trash.deleted'));
  };

  const emptyAll = async () => {
    await getDB().trash.clear();
    setConfirmAll(false);
    toast(t('trash.deleted'));
  };

  const daysLeft = (deletedAt: number) => Math.max(0, Math.ceil((deletedAt + TRASH_RETENTION_MS - Date.now()) / 86_400_000));

  return (
    <div className="flex h-full flex-col">
      <PageHeader icon="trash-2" title={t('trash.title')} subtitle={t('trash.emptyHint')} actions={items?.length ? <Button variant="danger" size="sm" icon="trash-2" onClick={() => setConfirmAll(true)}>{t('trash.emptyTrash')}</Button> : null} />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {items === undefined ? null : items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState icon="trash-2" title={t('trash.empty')} body={t('trash.emptyHint')} />
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface2 text-muted">
                  <Icon name={item.entity === 'box' ? 'box' : item.entity === 'tab' ? 'folder' : 'file-text'} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{item.label || t('common.untitled')}</div>
                  <div className="text-[0.85em] text-dim">
                    {t(item.entity === 'box' ? 'trash.kindBox' : item.entity === 'tab' ? 'trash.kindTab' : 'trash.kindCard')} · {t('trash.deletedAt', { when: fmt.relative(item.deletedAt) })} · {t('trash.expiresIn', { count: daysLeft(item.deletedAt) })}
                  </div>
                </div>
                <Button size="sm" icon="undo-2" onClick={() => void doRestore(item)} disabled={busy === item.id}>
                  {t('trash.restore')}
                </Button>
                <Button size="sm" variant="ghost" icon="x" onClick={() => void doPurge(item)} aria-label={`${t('trash.deleteForever')}: ${item.label}`}>
                  <span className="hidden sm:inline">{t('trash.deleteForever')}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title={t('trash.emptyTrash')}
        description={t('trash.emptyTrashConfirm', { count: items?.length ?? 0 })}
        width="sm"
        footer={
          <>
            <Button onClick={() => setConfirmAll(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" icon="trash-2" onClick={() => void emptyAll()}>
              {t('trash.deleteForever')}
            </Button>
          </>
        }
      >
        <p className="text-[0.95em] text-muted">{t('trash.emptyHint')}</p>
      </Dialog>
    </div>
  );
}
