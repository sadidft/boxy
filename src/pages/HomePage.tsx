import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useBoxes } from '@/hooks/data';
import { Button, EmptyState } from '@/components/ui/primitives';
import { BoxDialog } from '@/components/dialogs/BoxDialog';
import { PageHeader } from '@/components/shell/PageHeader';

/** Shown only when every Box is archived or gone after onboarding. */
export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const boxes = useBoxes(true);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <PageHeader icon="box" title={t('shell.boxes')} back={false} />
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState icon="box" title={boxes?.length ? t('shell.chooseBox') : t('shell.noBoxes')} body={boxes?.length ? undefined : t('onboarding.localFirst')} action={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>{t('shell.createFirstBox')}</Button>} />
      </div>
      <BoxDialog open={open} onOpenChange={setOpen} onCreated={(id) => void navigate({ to: '/b/$boxId', params: { boxId: id } })} />
    </div>
  );
}
