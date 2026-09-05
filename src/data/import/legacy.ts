import { z } from 'zod';
import { legacyId } from '../ids';
import { keysBetween } from '../order';
import type { Card, CardBody, LabelColor, TableBody, TableColumn, TableRow, Tab } from '../types';

/**
 * Reads data written by the previous Boxy (code 1.0.23):
 *   1. localStorage["boxy_data_v1"]         StoredData { _version, settings, boxes, tabs, cards, ... }
 *   2. localStorage["boxy_minimal_backup"]   subset without history
 *   3. exportAllData() file                  { _meta: { app: "Boxy", type: "full" }, settings, boxes, tabs, cards }
 *   4. exportBox() file                      { _meta: { app: "Boxy", type: "box" }, box, tabs, cards }
 * Parsing is lenient: missing fields get defaults, broken entities are skipped and reported.
 */

// guardrail-exception: default accent of the previous app, needed to detect a customised accent
// guardrail-exception: default accent stored by the previous app; needed to detect unchanged settings
const LEGACY_DEFAULT_ACCENT = '#0ea5e9';
const num = z.coerce.number().catch(0);
const str = z.string().catch('');

const legacyBox = z.object({
  id: z.string(),
  name: str,
  icon: str,
  order: num,
  createdAt: num,
  updatedAt: num,
});
const legacyTab = z.object({
  id: z.string(),
  boxId: z.string(),
  name: str,
  icon: str,
  pinned: z.boolean().catch(false),
  order: num,
  createdAt: num,
  updatedAt: num,
});
const legacyTable = z
  .object({
    mode: z.enum(['history', 'custom']).catch('custom'),
    columns: z.array(z.object({ id: z.string(), name: str, order: num })).catch([]),
    rows: z.array(z.object({ id: z.string(), cells: z.record(z.string(), z.string().catch('')).catch({}), order: num })).catch([]),
  })
  .nullable()
  .catch(null);
const legacyCard = z.object({
  id: z.string(),
  tabId: z.string(),
  title: str,
  content: str,
  tags: z.array(z.string()).catch([]),
  pinned: z.boolean().catch(false),
  copyCount: num,
  order: num,
  createdAt: num,
  updatedAt: num,
  history: z.array(z.object({ timestamp: num, action: z.string().catch('') })).catch([]),
  table: legacyTable,
});
const legacySettings = z
  .object({
    theme: z.enum(['system', 'dark', 'light']).catch('system'),
    primaryColor: z.string().catch(LEGACY_DEFAULT_ACCENT),
  })
  .partial()
  .catch({});

export type LegacyBox = z.infer<typeof legacyBox>;
export type LegacyTab = z.infer<typeof legacyTab>;
export type LegacyCard = z.infer<typeof legacyCard>;

export interface LegacyParsed {
  source: 'storage' | 'file-full' | 'file-box' | 'minimal-backup';
  version: string;
  boxes: LegacyBox[];
  tabs: LegacyTab[];
  cards: LegacyCard[];
  settings: z.infer<typeof legacySettings>;
  warnings: string[];
}

export class LegacyParseError extends Error {}

const LEGACY_SAMPLE_TITLES = new Set([
  // guardrail-exception: sample title written by the previous app, matched so it can be skipped
  'Welcome to Boxy! \u{1F389}',
  'Email Signature',
  'Meeting Notes Template',
]);

export function parseLegacy(input: string | unknown): LegacyParsed {
  let data: unknown = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      throw new LegacyParseError('Not valid JSON');
    }
  }
  if (!data || typeof data !== 'object') throw new LegacyParseError('Not a Boxy export');
  const d = data as Record<string, unknown>;
  const warnings: string[] = [];
  const take = <T>(schema: z.ZodType<T>, list: unknown, label: string): T[] => {
    if (!Array.isArray(list)) return [];
    const out: T[] = [];
    list.forEach((item, i) => {
      const r = schema.safeParse(item);
      if (r.success) out.push(r.data);
      else warnings.push(`${label} #${i + 1} skipped: ${r.error.issues[0]?.message ?? 'invalid'}`);
    });
    return out;
  };

  const meta = d._meta as { app?: string; type?: string; version?: string } | undefined;
  if (meta) {
    if (meta.app !== 'Boxy') throw new LegacyParseError('Not a Boxy export');
    if (meta.type === 'box') {
      const box = legacyBox.safeParse(d.box);
      if (!box.success) throw new LegacyParseError('Box export without a valid box');
      return {
        source: 'file-box',
        version: meta.version ?? 'unknown',
        boxes: [box.data],
        tabs: take(legacyTab, d.tabs, 'tab'),
        cards: take(legacyCard, d.cards, 'card'),
        settings: {},
        warnings,
      };
    }
    if (meta.type === 'full') {
      return {
        source: 'file-full',
        version: meta.version ?? 'unknown',
        boxes: take(legacyBox, d.boxes, 'box'),
        tabs: take(legacyTab, d.tabs, 'tab'),
        cards: take(legacyCard, d.cards, 'card'),
        settings: legacySettings.parse(d.settings),
        warnings,
      };
    }
    throw new LegacyParseError(`Unknown export type "${meta.type}"`);
  }
  if (Array.isArray(d.boxes) && Array.isArray(d.tabs) && Array.isArray(d.cards)) {
    const isStorage = typeof d._version === 'string';
    return {
      source: isStorage ? 'storage' : 'minimal-backup',
      version: (d._version as string | undefined) ?? 'unknown',
      boxes: take(legacyBox, d.boxes, 'box'),
      tabs: take(legacyTab, d.tabs, 'tab'),
      cards: take(legacyCard, d.cards, 'card'),
      settings: legacySettings.parse(d.settings),
      warnings,
    };
  }
  throw new LegacyParseError('Not a Boxy export');
}

/** Icon names of the previous app that do not exist in Lucide anymore. Everything else is a valid Lucide name. */
export const legacyIconMap: Record<string, string> = {
  boxy: 'box',
  'pizza-slice': 'pizza',
  bolt: 'zap',
};

export function mapLegacyIcon(name: string, fallback: string): string {
  const n = (name || '').trim();
  if (!n) return fallback;
  return legacyIconMap[n] ?? n;
}

export interface LegacyPlan {
  boxes: Array<{ id: string; legacyId: string; name: string; icon: string; color: LabelColor; order: string; createdAt: number; updatedAt: number }>;
  tabs: Tab[];
  cards: Card[];
  settings: { theme?: 'system' | 'dark' | 'light'; accentCustom?: string };
  counts: { boxes: number; tabs: number; cards: number; tablesSplit: number; historyTablesDropped: number; sampleSkipped: number; orphansRecovered: number };
  warnings: string[];
}

export interface LegacyPlanOptions {
  /** How custom tables inside a text card are handled. "split" (default) makes a separate table card next to it. */
  tables?: 'split' | 'inline';
  skipSamples?: boolean;
  now?: number;
}

const FORMULA_RE = /^(mnt|hrs|sec|dur|sum|avg|max|min|cnt|diff|days|weeks|last|first|pct|inc|streak)\/\/(all|\d+)$/i;
const boxPalette: LabelColor[] = ['mint', 'cyan', 'violet', 'pink', 'salmon', 'amber', 'lime', 'slate'];

export async function planLegacyImport(parsed: LegacyParsed, opts: LegacyPlanOptions = {}): Promise<LegacyPlan> {
  const now = opts.now ?? Date.now();
  const tables = opts.tables ?? 'split';
  const skipSamples = opts.skipSamples ?? true;
  const warnings = [...parsed.warnings];
  const counts = { boxes: 0, tabs: 0, cards: 0, tablesSplit: 0, historyTablesDropped: 0, sampleSkipped: 0, orphansRecovered: 0 };

  const boxIdMap = new Map<string, string>();
  const tabIdMap = new Map<string, string>();

  const sortedBoxes = [...parsed.boxes].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  const boxKeys = keysBetween(null, null, Math.max(sortedBoxes.length, 1));
  const boxes: LegacyPlan['boxes'] = [];
  for (const [i, b] of sortedBoxes.entries()) {
    const id = await legacyId(b.id, b.createdAt);
    boxIdMap.set(b.id, id);
    boxes.push({
      id,
      legacyId: b.id,
      name: b.name.trim() || 'Box',
      icon: mapLegacyIcon(b.icon, 'box'),
      color: boxPalette[i % boxPalette.length] ?? 'mint',
      order: boxKeys[i] ?? 'a0',
      createdAt: b.createdAt || now,
      updatedAt: b.updatedAt || b.createdAt || now,
    });
  }

  // Orphans go to a recovered box/tab, created lazily.
  let recoveredBoxId: string | null = null;
  let recoveredTabId: string | null = null;
  const ensureRecoveredBox = async () => {
    if (recoveredBoxId) return recoveredBoxId;
    recoveredBoxId = await legacyId('recovered-box', now);
    boxes.push({ id: recoveredBoxId, legacyId: 'recovered', name: 'Recovered', icon: 'life-buoy', color: 'slate', order: keysBetween(boxKeys[boxKeys.length - 1] ?? null, null, 1)[0] ?? 'z', createdAt: now, updatedAt: now });
    return recoveredBoxId;
  };

  const tabsByBox = new Map<string, LegacyTab[]>();
  for (const t of parsed.tabs) {
    const list = tabsByBox.get(t.boxId) ?? [];
    list.push(t);
    tabsByBox.set(t.boxId, list);
  }
  const tabsOut: Tab[] = [];
  for (const [legacyBoxId, list] of tabsByBox) {
    let boxId = boxIdMap.get(legacyBoxId);
    if (!boxId) {
      boxId = await ensureRecoveredBox();
      counts.orphansRecovered += list.length;
      warnings.push(`${list.length} tab(s) had no box and were moved to "Recovered"`);
    }
    const sorted = [...list].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
    const keys = keysBetween(null, null, sorted.length);
    for (const [i, t] of sorted.entries()) {
      const id = await legacyId(t.id, t.createdAt);
      tabIdMap.set(t.id, id);
      tabsOut.push({
        id,
        boxId,
        name: t.name.trim() || 'Tab',
        icon: mapLegacyIcon(t.icon, 'folder'),
        pinned: t.pinned,
        order: keys[i] ?? 'a0',
        kind: 'manual',
        createdAt: t.createdAt || now,
        updatedAt: t.updatedAt || t.createdAt || now,
      });
    }
  }
  const tabBox = new Map(tabsOut.map((t) => [t.id, t.boxId]));
  const ensureRecoveredTab = async () => {
    if (recoveredTabId) return recoveredTabId;
    const boxId = await ensureRecoveredBox();
    recoveredTabId = await legacyId('recovered-tab', now);
    tabsOut.push({ id: recoveredTabId, boxId, name: 'Recovered cards', icon: 'life-buoy', pinned: false, order: 'a0', kind: 'manual', createdAt: now, updatedAt: now });
    tabBox.set(recoveredTabId, boxId);
    return recoveredTabId;
  };

  const cardsByTab = new Map<string, LegacyCard[]>();
  for (const c of parsed.cards) {
    if (skipSamples && LEGACY_SAMPLE_TITLES.has(c.title) && /Getting Started|offline clipboard manager/i.test(c.content)) {
      counts.sampleSkipped += 1;
      continue;
    }
    const list = cardsByTab.get(c.tabId) ?? [];
    list.push(c);
    cardsByTab.set(c.tabId, list);
  }
  const cardsOut: Card[] = [];
  for (const [legacyTabId, list] of cardsByTab) {
    let tabId = tabIdMap.get(legacyTabId);
    if (!tabId) {
      tabId = await ensureRecoveredTab();
      counts.orphansRecovered += list.length;
      warnings.push(`${list.length} card(s) had no tab and were moved to "Recovered"`);
    }
    const boxId = tabBox.get(tabId)!;
    const sorted = [...list].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
    // Reserve two keys per card so a split table can sit right after its source card.
    const keys = keysBetween(null, null, sorted.length * 2);
    for (const [i, c] of sorted.entries()) {
      const id = await legacyId(c.id, c.createdAt);
      const lastCopied = c.history.filter((h) => h.action === 'copied').map((h) => h.timestamp).sort((a, b) => b - a)[0];
      const tags = dedupeTags(c.tags);
      const base: Card = {
        id,
        boxId,
        tabId,
        type: 'text',
        title: c.title.trim(),
        body: { md: c.content },
        tags,
        pinned: c.pinned,
        order: keys[i * 2] ?? 'a0',
        vars: {},
        stats: { copyCount: c.copyCount, lastCopiedAt: lastCopied, openCount: 0 },
        rev: 0,
        createdAt: c.createdAt || now,
        updatedAt: c.updatedAt || c.createdAt || now,
      };
      if (c.content.length > 50_000) warnings.push(`Card "${c.title || c.id}" is larger than 50 KB`);
      if (c.table) {
        if (c.table.mode === 'history') {
          counts.historyTablesDropped += 1;
        } else if (c.table.columns.length) {
          const tableBody = convertTable(c.table);
          if (tables === 'split') {
            cardsOut.push(base);
            cardsOut.push({
              ...base,
              id: await legacyId(`${c.id}:table`, c.createdAt),
              type: 'table',
              title: `${base.title || 'Table'} (table)`,
              body: tableBody,
              order: keys[i * 2 + 1] ?? 'a1',
              stats: { copyCount: 0, openCount: 0 },
            });
            counts.tablesSplit += 1;
            continue;
          }
          base.body = { md: `${c.content}\n\n${tableToMarkdown(tableBody)}` };
        }
      }
      cardsOut.push(base);
    }
  }

  counts.boxes = boxes.length;
  counts.tabs = tabsOut.length;
  counts.cards = cardsOut.length;
  const settings: LegacyPlan['settings'] = {};
  if (parsed.settings.theme) settings.theme = parsed.settings.theme;
  if (parsed.settings.primaryColor && parsed.settings.primaryColor.toLowerCase() !== LEGACY_DEFAULT_ACCENT) settings.accentCustom = parsed.settings.primaryColor;
  return { boxes, tabs: tabsOut, cards: cardsOut, settings, counts, warnings };
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of tags) {
    const t = String(raw).trim().replace(/^#/, '');
    if (!t) continue;
    const k = t.toLowerCase();
    if (!seen.has(k)) seen.set(k, t);
  }
  return [...seen.values()];
}

function convertTable(t: NonNullable<LegacyCard['table']>): TableBody {
  const cols = [...t.columns].sort((a, b) => a.order - b.order);
  const rows = [...t.rows].sort((a, b) => a.order - b.order);
  const colKeys = keysBetween(null, null, Math.max(cols.length, 1));
  const footer: Record<string, string> = {};
  const lastRow = rows[rows.length - 1];
  let lastRowIsFooter = false;
  if (lastRow) {
    const cells = Object.values(lastRow.cells).filter((v) => v.trim());
    lastRowIsFooter = cells.length > 0 && cells.every((v) => FORMULA_RE.test(v.trim()));
  }
  const dataRows = lastRowIsFooter ? rows.slice(0, -1) : rows;
  if (lastRowIsFooter && lastRow) for (const [k, v] of Object.entries(lastRow.cells)) if (v.trim()) footer[k] = v.trim();
  const columns: TableColumn[] = cols.map((c, i) => {
    const values = dataRows.map((r) => (r.cells[c.id] ?? '').trim()).filter((v) => v && !FORMULA_RE.test(v));
    const numeric = values.length > 0 && values.every((v) => v !== '' && !Number.isNaN(Number(v)));
    const time = values.length > 0 && values.every((v) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(v));
    const date = values.length > 0 && values.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v));
    return { id: c.id, name: c.name || `Column ${i + 1}`, type: numeric ? 'number' : time ? 'time' : date ? 'date' : 'text', order: colKeys[i] ?? 'a0' };
  });
  const rowKeys = keysBetween(null, null, Math.max(dataRows.length, 1));
  const outRows: TableRow[] = dataRows.map((r, i) => ({ id: r.id, cells: { ...r.cells }, order: rowKeys[i] ?? 'a0' }));
  return { columns, rows: outRows, footer };
}

export function tableToMarkdown(t: TableBody): string {
  const cols = t.columns;
  const head = `| ${cols.map((c) => c.name).join(' | ')} |`;
  const sep = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = t.rows.map((r) => `| ${cols.map((c) => (r.cells[c.id] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`);
  const footer = Object.keys(t.footer).length ? [`| ${cols.map((c) => t.footer[c.id] ?? '').join(' | ')} |`] : [];
  return [head, sep, ...body, ...footer].join('\n');
}

export type { CardBody };
