import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/app/settings-store';

export function formatRelative(ts: number | undefined, locale: string, now = Date.now(), neverLabel = 'never', justNowLabel = 'just now'): string {
  if (!ts) return neverLabel;
  const diff = ts - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' });
  if (abs < 45_000) return justNowLabel;
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), 'day');
  if (abs < 365 * 86_400_000) return rtf.format(Math.round(diff / (30 * 86_400_000)), 'month');
  return rtf.format(Math.round(diff / (365 * 86_400_000)), 'year');
}

export function formatBytes(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: i === 0 ? 0 : 1 }).format(v)} ${units[i]}`;
}

export function useFormat() {
  const locale = useSettings((s) => s.locale);
  const { t } = useTranslation();
  const dateTime = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }), [locale]);
  const date = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const relative = useCallback((ts: number | undefined) => formatRelative(ts, locale, Date.now(), t('common.never'), t('common.justNow')), [locale, t]);
  const bytes = useCallback((b: number) => formatBytes(b, locale), [locale]);
  return { locale, dateTime: (ts: number) => dateTime.format(ts), date: (ts: number) => date.format(ts), number: (n: number) => number.format(n), relative, bytes };
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
export const modKey = isMac ? 'Cmd' : 'Ctrl';
export const altKey = isMac ? 'Option' : 'Alt';
