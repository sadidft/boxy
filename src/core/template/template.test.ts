import { describe, expect, it } from 'vitest';
import { hasDynamicContent, parseTemplate, renderTemplate, type RenderContext } from './index';

const base = (over: Partial<RenderContext> = {}): RenderContext => ({
  now: new Date('2026-09-04T17:30:00Z'),
  locale: 'en',
  timeZone: 'Asia/Jakarta',
  values: {},
  globals: {},
  counters: {},
  ...over,
});

const render = (src: string, ctx: Partial<RenderContext> = {}) => renderTemplate(parseTemplate(src), base(ctx));

describe('template engine', () => {
  it('renders dates in the local time zone', () => {
    expect(render('{{date}}').text).toBe('2026-09-05');
    expect(render('{{date-1}}').text).toBe('2026-09-04');
    expect(render('{{today+3}}').text).toBe('2026-09-08');
    expect(render('{{time}}').text).toBe('00:30');
    expect(render('{{datetime}}').text).toBe('2026-09-05 00:30');
    expect(render('{{year}}').text).toBe('2026');
    expect(render('{{date}}', { timeZone: 'UTC' }).text).toBe('2026-09-04');
  });

  it('formats with fmt tokens and locale names', () => {
    expect(render('{{date+3|fmt:DD MMM YYYY}}', { locale: 'id' }).text).toBe('08 Sep 2026');
    expect(render('{{date+3|DD MMM}}', { locale: 'en' }).text).toBe('08 Sep');
    expect(render('{{weekday}}', { locale: 'id' }).text).toBe('Sabtu');
    expect(render('{{weekday}}', { locale: 'en' }).text).toBe('Saturday');
    expect(render('{{month}}', { locale: 'id' }).text).toBe('September');
    expect(render('{{date|fmt:dddd, D MMMM YYYY}}', { locale: 'id' }).text).toBe('Sabtu, 5 September 2026');
  });

  it('handles variables, defaults and choices', () => {
    expect(render('Hi {{name|default:there}}').text).toBe('Hi there');
    expect(render('Hi {{name|default:there}}', { values: { name: 'Ana' } }).text).toBe('Hi Ana');
    const parsed = parseTemplate('{{tone|choice:formal,friendly}} {{name}} {{name|upper}}');
    expect(parsed.vars.map((v) => v.name)).toEqual(['tone', 'name']);
    expect(parsed.vars[0]?.choices).toEqual(['formal', 'friendly']);
    expect(renderTemplate(parsed, base()).text).toBe('formal  ');
    expect(renderTemplate(parsed, base({ values: { name: 'bo' } })).text).toBe('formal bo BO');
    expect(render('{{x|title}}', { values: { x: 'hello big world' } }).text).toBe('Hello Big World');
  });

  it('keeps escapes and invalid expressions verbatim', () => {
    expect(render('\\{{not a var}}').text).toBe('{{not a var}}');
    expect(render('{{unknown thing}}').text).toBe('{{unknown thing}}');
    expect(render('{{ 3x }}').text).toBe('{{ 3x }}');
    expect(render('a {{ b').text).toBe('a {{ b');
    expect(hasDynamicContent('plain')).toBe(false);
    expect(hasDynamicContent('{{unknown thing}}')).toBe(false);
    expect(hasDynamicContent('{{date}}')).toBe(true);
  });

  it('renders counters and globals', () => {
    const r = render('Inv {{counter:invoice}} by {{global:signature}}', {
      counters: { invoice: { value: 41, pad: 4 } },
      globals: { signature: 'RS' },
    });
    expect(r.text).toBe('Inv 0042 by RS');
    expect(r.usedCounters).toEqual(['invoice']);
  });

  it('uses deterministic random, uuid, timestamp and clipboard', () => {
    const r = render('{{random}} {{uuid}} {{timestamp}} [{{clipboard}}]', {
      random: () => 0.5,
      uuid: () => 'u-1',
      clipboard: 'clip',
    });
    expect(r.text).toBe('550000 u-1 1788543000000 [clip]');
    expect(parseTemplate('{{clipboard}}').usesClipboard).toBe(true);
  });
});
