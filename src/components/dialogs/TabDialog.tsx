import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createTab, updateTab } from '@/data/repo/tabs';
import type { BoxId, Tab } from '@/data/types';
import { Button, Dialog, Field, Switch } from '@/components/ui/primitives';
import { IconPicker, rememberIcon } from '@/components/ui/IconPicker';

export function TabDialog({ open, onOpenChange, boxId, tab, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; boxId: BoxId; tab?: Tab | null; onCreated?: (id: string) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(tab?.name ?? '');
      setIcon(tab?.icon ?? 'folder');
      setPinned(tab?.pinned ?? false);
    }
  }, [open, tab]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      rememberIcon(icon);
      if (tab) await updateTab(boxId, tab.id, { name: trimmed, icon, pinned });
      else {
        const id = await createTab(boxId, { name: trimmed, icon, pinned });
        onCreated?.(id);
      }
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={tab ? t('shell.editTab') : t('shell.newTab')}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim() || busy}>
            {tab ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label={t('common.name')}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('shell.tabNamePlaceholder')} autoFocus maxLength={80} />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.95em]">{t('shell.pinTab')}</span>
          <Switch checked={pinned} onCheckedChange={setPinned} label={t('shell.pinTab')} />
        </div>
        <Field label={t('common.icon')}>
          <IconPicker value={icon} onChange={setIcon} />
        </Field>
      </form>
    </Dialog>
  );
}
