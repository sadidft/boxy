import i18n from '@/i18n';
import { toast } from '@/app/ui-store';
import { useSettings } from '@/app/settings-store';
import { removeBox } from '@/data/repo/boxes';
import { removeTab } from '@/data/repo/tabs';
import { createCard, getCard, recordCopy, rememberVar, removeCard } from '@/data/repo/cards';
import { restore } from '@/data/repo/trash';
import { getDB } from '@/data/db';
import { buildPayload, clearClipboardLater, defaultFormat, writeClipboard, type CopyFormat } from '@/core/copy';
import { parseTemplate, renderTemplate, type ParsedTemplate } from '@/core/template';
import type { BoxId, Card, CardId, TabId, TextBody } from '@/data/types';

/** Cross-cutting actions used by menus, shortcuts and the palette. UI code calls these, never repositories directly. */

export async function trashCard(boxId: BoxId, cardId: CardId): Promise<void> {
  const trashId = await removeCard(boxId, cardId);
  toast(i18n.t('cards.movedToTrash'), { action: { label: i18n.t('common.undo'), onClick: () => void restore(trashId) } });
}

export async function trashTab(boxId: BoxId, tabId: TabId, name: string): Promise<void> {
  const trashId = await removeTab(boxId, tabId);
  toast(i18n.t('shell.tabMovedToTrash', { name }), { action: { label: i18n.t('common.undo'), onClick: () => void restore(trashId) } });
}

export async function trashBox(boxId: BoxId, name: string): Promise<void> {
  const trashId = await removeBox(boxId);
  toast(i18n.t('shell.boxMovedToTrash', { name }), { action: { label: i18n.t('common.undo'), onClick: () => void restore(trashId) } });
}

export interface TemplateContextData {
  globals: Record<string, string>;
  counters: Record<string, { value: number; pad?: number }>;
}

export async function loadTemplateContext(): Promise<TemplateContextData> {
  const db = getDB();
  const [g, c] = await Promise.all([db.globals.toArray(), db.counters.toArray()]);
  return {
    globals: Object.fromEntries(g.map((x) => [x.key, x.value])),
    counters: Object.fromEntries(c.map((x) => [x.name, { value: x.value, pad: x.pad }])),
  };
}

export interface RenderedCopy {
  text: string;
  usedCounters: string[];
}

export async function renderCardText(parsed: ParsedTemplate, values: Record<string, string>, clipboard?: string): Promise<RenderedCopy> {
  const ctx = await loadTemplateContext();
  const { locale } = useSettings.getState();
  const out = renderTemplate(parsed, { now: new Date(), locale, values, globals: ctx.globals, counters: ctx.counters, clipboard });
  return { text: out.text, usedCounters: out.usedCounters };
}

/** Whether copying this card needs user input first (custom variables or clipboard permission). */
export function needsFill(card: Card): ParsedTemplate | null {
  if (card.type !== 'text') return null;
  const md = (card.body as TextBody).md;
  if (!md.includes('{{')) return null;
  const parsed = parseTemplate(md);
  return parsed.vars.length || parsed.usesClipboard ? parsed : null;
}

/** Copies a card. Returns false when a form fill is needed (caller opens the fill dialog). */
export async function copyCard(card: Card, format: CopyFormat = defaultFormat(card), values?: Record<string, string>, clipboardText?: string): Promise<boolean> {
  let rendered: string | undefined;
  let usedCounters: string[] = [];
  if (card.type === 'text') {
    const md = (card.body as TextBody).md;
    if (md.includes('{{')) {
      const parsed = parseTemplate(md);
      const missing = parsed.vars.filter((v) => (values?.[v.name] ?? '') === '' && v.defaultValue === undefined && !v.choices);
      if ((missing.length || (parsed.usesClipboard && clipboardText === undefined)) && !values) return false;
      const r = await renderCardText(parsed, values ?? {}, clipboardText);
      rendered = r.text;
      usedCounters = r.usedCounters;
    }
  }
  const payload = buildPayload(card, format, rendered);
  try {
    await writeClipboard(payload);
  } catch {
    toast(i18n.t('cards.copyFailed'), { kind: 'error' });
    return true;
  }
  await recordCopy(card.boxId, card.id);
  if (values) for (const [k, v] of Object.entries(values)) if (v) await rememberVar(card.boxId, card.id, k, v);
  if (usedCounters.length) {
    const db = getDB();
    for (const name of usedCounters) {
      const row = await db.counters.get(name);
      await db.counters.put({ name, value: (row?.value ?? 0) + 1, pad: row?.pad, updatedAt: Date.now() });
    }
  }
  const seconds = useSettings.getState().settings.clipboardClearSeconds;
  if (seconds) void clearClipboardLater(seconds, payload.plain);
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // ignore
    }
  }
  toast(i18n.t('cards.copiedTitle', { title: card.title || i18n.t('common.untitled') }), { kind: 'success', timeout: 1800 });
  return true;
}

export async function copyCardById(boxId: BoxId, cardId: CardId): Promise<Card | null> {
  const card = await getCard(boxId, cardId);
  if (!card) return null;
  const ok = await copyCard(card);
  return ok ? null : card;
}

export async function createCardFromText(boxId: BoxId, tabId: TabId, text: string): Promise<CardId> {
  const firstLine = text.split('\n').find((l) => l.trim())?.trim() ?? '';
  const title = firstLine.replace(/^#+\s*/, '').slice(0, 80);
  const looksLikeTable = text.includes('\t') && text.split('\n').filter(Boolean).length > 1;
  if (looksLikeTable) {
    const lines = text.split('\n').filter((l) => l.trim());
    const cells = lines.map((l) => l.split('\t'));
    const header = cells[0]!;
    const { keysBetween } = await import('@/data/order');
    const colKeys = keysBetween(null, null, header.length);
    const rowKeys = keysBetween(null, null, Math.max(cells.length - 1, 1));
    const columns = header.map((name, i) => ({ id: `c${i + 1}`, name: name.trim() || `C${i + 1}`, type: 'text' as const, order: colKeys[i]! }));
    const rows = cells.slice(1).map((r, ri) => ({ id: `r${ri + 1}`, order: rowKeys[ri]!, cells: Object.fromEntries(columns.map((c, ci) => [c.id, (r[ci] ?? '').trim()])) }));
    return createCard(boxId, tabId, { type: 'table', title: i18n.t('cards.table'), body: { columns, rows, footer: {} } });
  }
  return createCard(boxId, tabId, { type: 'text', title, body: { md: text } });
}
