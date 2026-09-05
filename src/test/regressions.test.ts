/**
 * Regression tests for the bugs of the previous Boxy (masterplan §1.3). One block per bug id; docs/regressions.md links here.
 * Bugs that are covered by a dedicated suite elsewhere are referenced there instead of duplicated.
 */
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '@/core/markdown';
import { parseTemplate, renderTemplate, type RenderContext } from '@/core/template';
import { createBox } from '@/data/repo/boxes';
import { createTab } from '@/data/repo/tabs';
import { createCard, getCard, listCards, moveCard, recordCopy, updateCard } from '@/data/repo/cards';
import { canUndo, undo } from '@/data/repo/undo';
import { flushProjections } from '@/data/store';

const ordered = async (boxId: string, tabId: string) => (await listCards(boxId, tabId)).sort((a, b) => (a.order < b.order ? -1 : 1)).map((c) => c.id);

describe('B1: dates follow the local time zone, not UTC', () => {
  it('shows the local calendar day just after midnight in Jakarta', () => {
    // 2026-09-04 17:30 UTC is 2026-09-05 00:30 in Asia/Jakarta; the previous app printed 2026-09-04 here.
    const ctx: RenderContext = { now: new Date(Date.UTC(2026, 8, 4, 17, 30)), locale: 'en', timeZone: 'Asia/Jakarta', values: {}, globals: {}, counters: {} };
    expect(renderTemplate(parseTemplate('{{date}}'), ctx).text).toBe('2026-09-05');
    expect(renderTemplate(parseTemplate('{{date}}'), { ...ctx, timeZone: 'UTC' }).text).toBe('2026-09-04');
  });
});

describe('B2: markdown images render as images', () => {
  it('does not turn ![alt](url) into a broken link', () => {
    const html = renderMarkdown('![Logo](https://example.com/logo.png)');
    expect(html).toContain('<img');
    expect(html).toContain('alt="Logo"');
    expect(html).not.toContain('!<a');
  });
});

describe('B3: ordered and nested lists', () => {
  it('renders 1. 2. as an <ol> and keeps nesting', () => {
    const html = renderMarkdown('1. one\n2. two\n   - nested');
    expect(html).toMatch(/<ol>[\s\S]*<li>one[\s\S]*<li>two[\s\S]*<ul>[\s\S]*nested/);
  });
});

describe('B4: dangerous URL schemes are removed regardless of case', () => {
  it.each(['JavaScript:alert(1)', 'jAvAsCrIpT:alert(1)', 'data:text/html;base64,AAAA', 'VBSCRIPT:msgbox'])('%s', (href) => {
    const html = renderMarkdown(`[x](${href})`);
    expect(/href="\s*(javascript|data|vbscript):/i.test(html)).toBe(false);
  });
});

describe('A7: undo covers reordering and moving', () => {
  it('undoes a reorder', async () => {
    const boxId = await createBox({ name: 'Undo box', icon: 'box', color: 'mint' });
    const tabId = await createTab(boxId, { name: 'Tab' });
    const a = await createCard(boxId, tabId, { type: 'text', title: 'A', body: { md: 'a' } });
    const b = await createCard(boxId, tabId, { type: 'text', title: 'B', body: { md: 'b' } });
    await flushProjections();
    // the undo stack ignores the first 400 ms so that creation of the fixture is not captured as one step
    await new Promise((r) => setTimeout(r, 450));
    expect(await ordered(boxId, tabId)).toEqual([a, b]);
    await moveCard(boxId, b, tabId, null, a);
    await flushProjections();
    expect(await ordered(boxId, tabId)).toEqual([b, a]);
    expect(canUndo(boxId)).toBe(true);
    expect(await undo(boxId)).toBe(true);
    await flushProjections();
    expect(await ordered(boxId, tabId)).toEqual([a, b]);
  });

  it('does not let a copy count swallow the undo of an edit', async () => {
    const boxId = await createBox({ name: 'Undo copy', icon: 'box', color: 'mint' });
    const tabId = await createTab(boxId, { name: 'Tab' });
    const id = await createCard(boxId, tabId, { type: 'text', title: 'Before', body: { md: 'x' } });
    await flushProjections();
    await new Promise((r) => setTimeout(r, 450));
    await updateCard(boxId, id, { title: 'After' });
    await recordCopy(boxId, id);
    await flushProjections();
    expect(await undo(boxId)).toBe(true);
    await flushProjections();
    const card = await getCard(boxId, id);
    expect(card?.title).toBe('Before');
  });
});
