import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Icon } from '@/components/ui/Icon';
import { useUI } from '@/app/ui-store';
import { IconButton } from '@/components/ui/primitives';

export function PageHeader({ icon, title, subtitle, actions, back = true }: { icon: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: boolean }) {
  const { t } = useTranslation();
  const toggleRail = useUI((s) => s.toggleRail);
  return (
    <header className="drag-region flex min-h-[var(--shell-omni)] items-center gap-2 border-b border-line px-3 py-1.5">
      <IconButton icon="panel-left" label={t('shell.boxes')} onClick={toggleRail} className="no-drag md:hidden" />
      {back ? (
        <Link to="/" className="no-drag icon-btn" aria-label={t('settings.backToApp')}>
          <Icon name="arrow-left" size={16} />
        </Link>
      ) : null}
      <span className="flex h-7 w-7 items-center justify-center rounded-control bg-accent-soft text-accent">
        <Icon name={icon} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[1.02em] font-semibold">{title}</h1>
        {subtitle ? <p className="truncate text-[0.8em] text-dim">{subtitle}</p> : null}
      </div>
      <div className="no-drag flex items-center gap-1.5">{actions}</div>
    </header>
  );
}
