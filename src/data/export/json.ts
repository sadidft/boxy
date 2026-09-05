import { z } from 'zod';
import { getDB } from '../db';
import { listBoxes } from '../repo/boxes';
import { listTabs } from '../repo/tabs';
import { listCards } from '../repo/cards';
import { loadSettings } from '../repo/settings';
import { flushProjections } from '../store';
import type { BoxId, BoxMeta, Card, Tab } from '../types';


/** Boxy export format 2. */
export interface BoxyExport {
  _meta: { app: 'Boxy'; format: 2; kind: 'full' | 'box'; exportedAt: string; build: string; sha256?: string };
  settings?: Record<string, unknown>;
  globals: { key: string; value: string }[];
  counters: { name: string; value: number; pad?: number }[];
  boxes: Omit<BoxMeta, 'cardCount' | 'tabCount'>[];
  tabs: Tab[];
  cards: Card[];
}

const exportSchema = z.object({
  _meta: z.object({ app: z.literal('Boxy'), format: z.literal(2), kind: z.enum(['full', 'box']), exportedAt: z.string(), build: z.string().optional(), sha256: z.string().optional() }),
  settings: z.record(z.string(), z.unknown()).optional(),
  globals: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  counters: z.array(z.object({ name: z.string(), value: z.number(), pad: z.number().optional() })).default([]),
  boxes: z.array(z.any()),
  tabs: z.array(z.any()),
  cards: z.array(z.any()),
});

export function isBoxyFormat2(data: unknown): data is BoxyExport {
  return exportSchema.safeParse(data).success;
}

export async function buildExport(kind: 'full' | 'box', boxId?: BoxId): Promise<BoxyExport> {
  await flushProjections();
  const db = getDB();
  const boxes = (await listBoxes()).filter((b) => (kind === 'full' ? true : b.id === boxId));
  const tabs: Tab[] = [];
  const cards: Card[] = [];
  for (const b of boxes) {
    tabs.push(...(await listTabs(b.id)));
    cards.push(...(await listCards(b.id)));
  }
  const settings = kind === 'full' ? ((await loadSettings()) as unknown as Record<string, unknown>) : undefined;
  const exp: BoxyExport = {
    _meta: { app: 'Boxy', format: 2, kind, exportedAt: new Date().toISOString(), build: typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev' },
    ...(settings ? { settings: stripSettings(settings) } : {}),
    globals: (await db.globals.toArray()).map(({ key, value }) => ({ key, value })),
    counters: (await db.counters.toArray()).map(({ name, value, pad }) => ({ name, value, ...(pad ? { pad } : {}) })),
    boxes: boxes.map(({ cardCount: _c, tabCount: _t, ...rest }) => rest),
    tabs,
    cards,
  };
  exp._meta.sha256 = await sha256(canonical(exp));
  return exp;
}

function stripSettings(s: Record<string, unknown>): Record<string, unknown> {
  const { storageMode: _m, lastBoxId: _l, lastTabByBox: _t, autoBackup: _a, ...rest } = s;
  return rest;
}

export function canonical(exp: BoxyExport): string {
  const { _meta, ...rest } = exp;
  const { sha256: _s, ...meta } = _meta;
  return stableStringify({ _meta: meta, ...rest });
}

export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .filter((k) => o[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

export async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

export function exportFileName(kind: 'full' | 'box', name?: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  const safe = (name ?? '').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return kind === 'full' ? `boxy-backup-${stamp}.json` : `boxy-box-${safe || 'box'}-${stamp}.json`;
}
