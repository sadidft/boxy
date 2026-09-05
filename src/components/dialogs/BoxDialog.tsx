import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createBox, updateBox } from '@/data/repo/boxes';
import type { BoxMeta, LabelColor } from '@/data/types';
import { labelColors } from '@/styles/tokens';
import { Button, Dialog, Field } from '@/components/ui/primitives';
import { IconPicker, rememberIcon } from '@/components/ui/IconPicker';

export function BoxDialog({ open, onOpenChange, box, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; box?: BoxMeta | null; onCreated?: (id: string) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('box');
  const [color, setColor] = useState<LabelColor>('mint');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(box?.name ?? '');
      setIcon(box?.icon ?? 'box');
      setColor((box?.color as LabelColor) ?? 'mint');
    }
  }, [open, box]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      rememberIcon(icon);
      if (box) await updateBox(box.id, { name: trimmed, icon, color });
      else {
        const id = await createBox({ name: trimmed, icon, color });
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
      title={box ? t('shell.editBox') : t('shell.newBox')}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim() || busy}>
            {box ? t('common.save') : t('common.create')}
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
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('shell.boxNamePlaceholder')} autoFocus maxLength={80} />
        </Field>
        <Field label={t('common.color')}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('common.color')}>
            {labelColors.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={t(`cards.labels.${c}`)}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${c === color ? 'scale-110 border-text' : 'border-transparent'}`}
                style={{ background: `var(--label-${c})` }}
              />
            ))}
          </div>
        </Field>
        <Field label={t('common.icon')}>
          <IconPicker value={icon} onChange={setIcon} />
        </Field>
      </form>
    </Dialog>
  );
}
