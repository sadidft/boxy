import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { useBoxes, useCounts } from '@/hooks/data';
import type { BoxMeta } from '@/data/types';
import { Icon } from '@/components/ui/Icon';
import { IconButton, Tooltip } from '@/components/ui/primitives';
import { BoxDialog } from '@/components/dialogs/BoxDialog';
import { modKey } from '@/hooks/format';

export function boxInitial(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

export function BoxAvatar({ box, size = 38, active }: { box: BoxMeta; size?: number; active?: boolean }) {
  const isHex = box.color.startsWith('#');
  const bg = isHex ? box.color : `var(--label-${box.color})`;
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center font-bold text-[var(--bg)] transition-opacity ${active ? 'opacity-100 ring-2 ring-accent ring-offset-2 ring-offset-bg' : 'opacity-85 hover:opacity-100'}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), background: bg, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {box.icon && box.icon !== 'box' ? <Icon name={box.icon} size={Math.round(size * 0.5)} strokeWidth={2.2} /> : boxInitial(box.name)}
    </span>
  );
}

export function Rail({ activeBoxId }: { activeBoxId?: string }) {
  const { t } = useTranslation();
  const boxes = useBoxes();
  const counts = useCounts();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <nav aria-label={t('shell.boxes')} className="flex h-full w-[var(--shell-rail)] flex-col items-center gap-1.5 border-r border-line bg-surface/60 py-2">
      <Link to="/" className="mb-1 flex h-9 w-9 items-center justify-center rounded-control" aria-label={t('common.appName')}>
        <img src="/logo.svg" alt="" width="26" height="34" />
      </Link>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2 [scrollbar-width:none]">
        {boxes?.map((box, i) => (
          <Tooltip key={box.id} label={`${box.name}${i < 9 ? ` (${modKey}+${i + 1})` : ''}`} side="right">
            <Link to="/b/$boxId" params={{ boxId: box.id }} className="relative rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={box.name} aria-current={box.id === activeBoxId ? 'page' : undefined}>
              <BoxAvatar box={box} active={box.id === activeBoxId} />
              {box.cardCount > 0 ? (
                <span className="absolute -top-1 -right-1 rounded-full border border-line-strong bg-surface2 px-1 text-[9px] leading-[14px] font-semibold text-muted" aria-hidden="true">
                  {box.cardCount > 99 ? '99+' : box.cardCount}
                </span>
              ) : null}
            </Link>
          </Tooltip>
        ))}
        <Tooltip label={t('shell.newBox')} side="right">
          <button type="button" onClick={() => setDialogOpen(true)} className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-dashed border-line-strong text-dim hover:border-accent hover:text-accent" aria-label={t('shell.newBox')}>
            <Icon name="plus" size={18} />
          </button>
        </Tooltip>
      </div>
      <div className="mt-auto flex flex-col items-center gap-1 border-t border-line pt-2">
        <Link to="/trash" className="relative" aria-label={t('shell.trash')}>
          <IconButton icon="trash-2" label={t('shell.trash')} tabIndex={-1} />
          {counts?.trash ? <span className="absolute top-0 right-0 rounded-full bg-surface2 px-1 text-[9px] leading-[14px] text-muted">{counts.trash}</span> : null}
        </Link>
        <Link to="/settings/$section" params={{ section: 'appearance' }} aria-label={t('shell.settings')}>
          <IconButton icon="settings" label={t('shell.settings')} tabIndex={-1} />
        </Link>
      </div>
      <BoxDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={(id) => void navigate({ to: '/b/$boxId', params: { boxId: id } })} />
    </nav>
  );
}
