import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

const RECENT_KEY = 'boxy.icons.recent';
const SUGGESTED = ['box', 'folder', 'briefcase', 'house', 'mail', 'terminal', 'code', 'book-open', 'graduation-cap', 'heart', 'star', 'zap', 'link', 'globe', 'calendar', 'clock', 'shopping-cart', 'wallet', 'camera', 'music', 'gamepad-2', 'plane', 'car', 'coffee', 'pizza', 'dumbbell', 'stethoscope', 'wrench', 'palette', 'megaphone', 'message-square', 'phone', 'users', 'user', 'lock', 'key', 'shield', 'lightbulb', 'flag', 'tag', 'bookmark', 'file-text', 'table', 'database', 'cloud', 'git-branch', 'bug', 'rocket', 'leaf', 'sun', 'moon'];

let namesPromise: Promise<string[]> | null = null;
function loadNames(): Promise<string[]> {
  if (!namesPromise) namesPromise = import('lucide-react/dynamic').then((m) => m.iconNames as string[]);
  return namesPromise;
}

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function rememberIcon(name: string): void {
  try {
    const list = [name, ...readRecent().filter((n) => n !== name)].slice(0, 16);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [names, setNames] = useState<string[] | null>(null);
  const recent = useMemo(readRecent, []);

  useEffect(() => {
    if (deferred.trim() && !names) void loadNames().then(setNames);
  }, [deferred, names]);

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase().replace(/\s+/g, '-');
    if (!q) return null;
    if (!names) return [];
    const starts = names.filter((n) => n.startsWith(q));
    const contains = names.filter((n) => !n.startsWith(q) && n.includes(q));
    return [...starts, ...contains].slice(0, 120);
  }, [deferred, names]);

  const grid = (list: string[]) => (
    <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
      {list.map((n) => (
        <button
          key={n}
          type="button"
          title={n}
          aria-label={n}
          aria-pressed={n === value}
          onClick={() => onChange(n)}
          className={`flex h-9 items-center justify-center rounded-control border transition-colors ${n === value ? 'border-accent bg-accent-soft text-accent' : 'border-transparent text-muted hover:bg-surface2 hover:text-text'}`}
        >
          <Icon name={n} size={18} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-surface2 text-accent">
          <Icon name={value} size={18} />
        </div>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('shell.iconSearch')} aria-label={t('shell.iconSearch')} />
      </div>
      {results ? (
        results.length ? (
          grid(results)
        ) : names ? (
          <p className="py-4 text-center text-[0.9em] text-dim">{t('shell.iconNoResults')}</p>
        ) : (
          <p className="py-4 text-center text-[0.9em] text-dim">{t('common.loading')}</p>
        )
      ) : (
        <>
          {recent.length ? (
            <div>
              <div className="mb-1 text-[0.8em] font-semibold tracking-wide text-dim uppercase">{t('shell.iconRecent')}</div>
              {grid(recent)}
            </div>
          ) : null}
          {grid(SUGGESTED)}
        </>
      )}
    </div>
  );
}
