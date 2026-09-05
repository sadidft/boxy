import { useTranslation } from 'react-i18next';
import { modKey } from '@/hooks/format';
import { Shortcut } from '@/components/ui/primitives';

export const SHORTCUTS: { group: 'groupNavigation' | 'groupCards' | 'groupEditing'; key: string; keys: string }[] = [
  { group: 'groupNavigation', key: 'palette', keys: `${modKey}+K` },
  { group: 'groupNavigation', key: 'focusSearch', keys: '/' },
  { group: 'groupNavigation', key: 'goBox', keys: `${modKey}+1..9` },
  { group: 'groupNavigation', key: 'nextTab', keys: `${modKey}+]` },
  { group: 'groupNavigation', key: 'prevTab', keys: `${modKey}+[` },
  { group: 'groupNavigation', key: 'help', keys: '?' },
  { group: 'groupCards', key: 'newCard', keys: `${modKey}+N` },
  { group: 'groupCards', key: 'moveFocus', keys: 'Arrows' },
  { group: 'groupCards', key: 'openCard', keys: 'Enter' },
  { group: 'groupCards', key: 'copyCard', keys: 'C' },
  { group: 'groupCards', key: 'quickCopy', keys: 'Alt+1..9' },
  { group: 'groupCards', key: 'pasteCard', keys: `${modKey}+V` },
  { group: 'groupEditing', key: 'saveAndCopy', keys: `${modKey}+Enter` },
  { group: 'groupEditing', key: 'close', keys: 'Esc' },
  { group: 'groupEditing', key: 'undo', keys: `${modKey}+Z` },
  { group: 'groupEditing', key: 'redo', keys: `${modKey}+Shift+Z` },
  { group: 'groupEditing', key: 'toggleTheme', keys: `${modKey}+Shift+L` },
];

export function ShortcutList() {
  const { t } = useTranslation();
  const groups = ['groupNavigation', 'groupCards', 'groupEditing'] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {groups.map((g) => (
        <div key={g}>
          <h3 className="mb-1.5 text-[0.8em] font-semibold tracking-wider text-dim uppercase">{t(`settings.${g}`)}</h3>
          <ul className="space-y-1.5">
            {SHORTCUTS.filter((s) => s.group === g).map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-[0.92em]">
                <span className="text-muted">{t(`shortcuts.${s.key}`)}</span>
                <Shortcut keys={s.keys} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
