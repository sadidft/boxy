import { useTranslation } from 'react-i18next';
import { useQuickSlots } from '@/hooks/data';
import { copyCardById } from '@/app/actions';
import { useUI } from '@/app/ui-store';
import { Kbd, Tooltip } from '@/components/ui/primitives';
import { altKey } from '@/hooks/format';

export function QuickBar({ onNeedsFill }: { onNeedsFill: (boxId: string, cardId: string) => void }) {
  const { t } = useTranslation();
  const slots = useQuickSlots();
  const setShortcutsOpen = useUI((s) => s.setShortcutsOpen);
  return (
    <div className="flex h-[var(--shell-quick)] items-center gap-1.5 border-t border-line bg-surface/60 px-3 text-[0.9em] text-muted" role="toolbar" aria-label={t('shell.quickBar')}>
      <span className="mr-1 text-[0.85em] font-semibold tracking-wider text-dim uppercase">{t('shell.quickBar')}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {slots?.length ? (
          slots.map((c) => (
            <Tooltip key={c.id} label={`${altKey}+${c.quickSlot}`}>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 rounded-[7px] border border-line bg-surface px-2 py-0.5 hover:border-accent/50 hover:text-text"
                onClick={() => {
                  void copyCardById(c.boxId, c.id).then((card) => {
                    if (card) onNeedsFill(card.boxId, card.id);
                  });
                }}
              >
                <b className="font-ui text-[0.85em] text-accent">{c.quickSlot}</b>
                <span className="max-w-[160px] truncate">{c.title || t('common.untitled')}</span>
              </button>
            </Tooltip>
          ))
        ) : (
          <span className="text-dim">{t('shell.quickBarEmpty')}</span>
        )}
      </div>
      <div className="ml-auto hidden shrink-0 items-center gap-1.5 text-[0.85em] text-dim lg:flex">
        <span>
          {t('shell.quickBarHint', { shortcut: '' })}
          <Kbd>{altKey}</Kbd>+<Kbd>1..9</Kbd>
        </span>
        <span aria-hidden="true">|</span>
        <button type="button" className="flex items-center gap-1 hover:text-text" onClick={() => setShortcutsOpen(true)}>
          <Kbd>?</Kbd> {t('shell.shortcutsHelp')}
        </button>
      </div>
    </div>
  );
}
