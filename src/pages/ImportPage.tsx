import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shell/PageHeader';
import { ImportPanel } from '@/components/import/ImportPanel';

export function ImportPage() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col">
      <PageHeader icon="arrow-down-to-line" title={t('import.title')} subtitle={t('import.formats')} />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto max-w-2xl">
          <ImportPanel />
        </div>
      </div>
    </div>
  );
}
