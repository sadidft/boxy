import { describe, expect, it } from 'vitest';
import en from './en.json';
import id from './id.json';
import { detectLocale } from './index';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

// Indonesian has no plural forms; i18next only needs the _other key.
const normalise = (keys: string[]) => keys.map((k) => k.replace(/_(one|other)$/, '_plural')).filter((k, i, a) => a.indexOf(k) === i);

describe('i18n resources', () => {
  it('have the same keys in EN and ID', () => {
    const enKeys = normalise(flatten(en));
    const idKeys = normalise(flatten(id));
    expect(idKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
    expect(enKeys.filter((k) => !idKeys.includes(k))).toEqual([]);
  });

  it('keep glossary terms untranslated in ID', () => {
    const text = JSON.stringify(id);
    for (const term of ['Box', 'Tab', 'Card', 'Quick Bar', 'Trash', 'Boxy Cloud', 'Self Cloud', 'Boxy Bridge']) expect(text).toContain(term);
  });

  it('detects the browser language', () => {
    expect(detectLocale('auto', ['id-ID', 'en-US'])).toBe('id');
    expect(detectLocale('auto', ['fr-FR', 'en'])).toBe('en');
    expect(detectLocale('auto', ['ja'])).toBe('en');
    expect(detectLocale('id', ['en'])).toBe('id');
  });
});
