import * as Y from 'yjs';
import type { BoxMeta, Card, CardBody, CardIndex, CardType, Tab, TableBody, TextBody, VarMemory } from './types';

/** Converts between Y types and plain objects. Only the data layer imports this file. */

export const yText = (value: string): Y.Text => {
  const t = new Y.Text();
  t.insert(0, value);
  return t;
};

export function bodyToY(type: CardType, body: CardBody): Y.Map<unknown> {
  const m = new Y.Map<unknown>();
  if (type === 'table') {
    const b = body as TableBody;
    const columns = new Y.Array<Y.Map<unknown>>();
    for (const c of b.columns) {
      const cm = new Y.Map<unknown>();
      cm.set('id', c.id);
      cm.set('name', c.name);
      cm.set('type', c.type);
      cm.set('order', c.order);
      if (c.width) cm.set('width', c.width);
      columns.push([cm]);
    }
    const rows = new Y.Array<Y.Map<unknown>>();
    for (const r of b.rows) {
      const rm = new Y.Map<unknown>();
      rm.set('id', r.id);
      rm.set('order', r.order);
      const cells = new Y.Map<unknown>();
      for (const [k, v] of Object.entries(r.cells)) cells.set(k, v);
      rm.set('cells', cells);
      rows.push([rm]);
    }
    const footer = new Y.Map<unknown>();
    for (const [k, v] of Object.entries(b.footer ?? {})) footer.set(k, v);
    m.set('columns', columns);
    m.set('rows', rows);
    m.set('footer', footer);
    return m;
  }
  const b = body as TextBody;
  m.set('md', yText(b.md ?? ''));
  return m;
}

export function bodyFromY(type: CardType, m: Y.Map<unknown> | undefined): CardBody {
  if (!m) return type === 'table' ? { columns: [], rows: [], footer: {} } : { md: '' };
  if (type === 'table') {
    const columns = ((m.get('columns') as Y.Array<Y.Map<unknown>>) ?? new Y.Array()).toArray().map((cm) => ({
      id: String(cm.get('id')),
      name: String(cm.get('name') ?? ''),
      type: (cm.get('type') as TableBody['columns'][number]['type']) ?? 'text',
      order: String(cm.get('order') ?? ''),
      ...(cm.get('width') ? { width: Number(cm.get('width')) } : {}),
    }));
    const rows = ((m.get('rows') as Y.Array<Y.Map<unknown>>) ?? new Y.Array()).toArray().map((rm) => {
      const cellsY = rm.get('cells') as Y.Map<unknown> | undefined;
      const cells: Record<string, string> = {};
      cellsY?.forEach((v, k) => {
        cells[k] = v instanceof Y.Text ? v.toString() : String(v ?? '');
      });
      return { id: String(rm.get('id')), order: String(rm.get('order') ?? ''), cells };
    });
    const footer: Record<string, string> = {};
    (m.get('footer') as Y.Map<unknown> | undefined)?.forEach((v, k) => {
      footer[k] = String(v ?? '');
    });
    return { columns, rows, footer };
  }
  const md = m.get('md');
  return { md: md instanceof Y.Text ? md.toString() : String(md ?? '') };
}

export function cardFromY(boxId: string, cm: Y.Map<unknown>): Card {
  const type = (cm.get('type') as CardType) ?? 'text';
  const tagsY = cm.get('tags');
  const tags = tagsY instanceof Y.Array ? (tagsY.toArray() as string[]) : Array.isArray(tagsY) ? (tagsY as string[]) : [];
  const varsY = cm.get('vars') as Y.Map<unknown> | undefined;
  const vars: Record<string, VarMemory> = {};
  varsY?.forEach((v, k) => {
    vars[k] = v as VarMemory;
  });
  const statsY = cm.get('stats') as Y.Map<unknown> | undefined;
  return {
    id: String(cm.get('id')),
    boxId,
    tabId: String(cm.get('tabId')),
    type,
    title: String(cm.get('title') ?? ''),
    body: bodyFromY(type, cm.get('body') as Y.Map<unknown> | undefined),
    tags,
    label: (cm.get('label') as Card['label']) ?? undefined,
    pinned: Boolean(cm.get('pinned')),
    order: String(cm.get('order') ?? ''),
    quickSlot: (cm.get('quickSlot') as number | undefined) ?? undefined,
    vars,
    stats: {
      copyCount: Number(statsY?.get('copyCount') ?? 0),
      lastCopiedAt: (statsY?.get('lastCopiedAt') as number | undefined) ?? undefined,
      openCount: Number(statsY?.get('openCount') ?? 0),
    },
    rev: Number(cm.get('rev') ?? 0),
    createdAt: Number(cm.get('createdAt') ?? 0),
    updatedAt: Number(cm.get('updatedAt') ?? 0),
  };
}

export function tabFromY(boxId: string, tm: Y.Map<unknown>): Tab {
  return {
    id: String(tm.get('id')),
    boxId,
    name: String(tm.get('name') ?? ''),
    icon: String(tm.get('icon') ?? 'folder'),
    pinned: Boolean(tm.get('pinned')),
    order: String(tm.get('order') ?? ''),
    kind: (tm.get('kind') as Tab['kind']) ?? 'manual',
    smartQuery: (tm.get('smartQuery') as string | undefined) ?? undefined,
    createdAt: Number(tm.get('createdAt') ?? 0),
    updatedAt: Number(tm.get('updatedAt') ?? 0),
  };
}

export function boxMetaFromY(doc: Y.Doc): Omit<BoxMeta, 'cardCount' | 'tabCount'> {
  const bm = doc.getMap('box');
  return {
    id: String(bm.get('id') ?? doc.guid),
    name: String(bm.get('name') ?? ''),
    icon: String(bm.get('icon') ?? 'box'),
    color: (bm.get('color') as BoxMeta['color']) ?? 'mint',
    order: String(bm.get('order') ?? ''),
    archived: Boolean(bm.get('archived')),
    sync: (bm.get('sync') as BoxMeta['sync']) ?? 'local',
    createdAt: Number(bm.get('createdAt') ?? 0),
    updatedAt: Number(bm.get('updatedAt') ?? 0),
  };
}

const VAR_RE = /\{\{\s*[a-zA-Z_][\w:+-]*(\s*\|[^}]*)?\s*\}\}/;

export function plainPreview(card: Card, max = 160): string {
  if (card.type === 'table') {
    const b = card.body as TableBody;
    return `${b.columns.map((c) => c.name).join(' | ')}`.slice(0, max);
  }
  const md = (card.body as TextBody).md ?? '';
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function indexFromCard(card: Card): CardIndex {
  const bodyText = card.type === 'table' ? JSON.stringify(card.body) : (card.body as TextBody).md ?? '';
  return {
    id: card.id,
    boxId: card.boxId,
    tabId: card.tabId,
    type: card.type,
    title: card.title,
    preview: plainPreview(card),
    tags: card.tags,
    pinned: card.pinned ? 1 : 0,
    label: card.label,
    order: card.order,
    quickSlot: card.quickSlot,
    copyCount: card.stats.copyCount,
    lastCopiedAt: card.stats.lastCopiedAt,
    hasVars: VAR_RE.test(card.title) || VAR_RE.test(bodyText) ? 1 : 0,
    bytes: bodyText.length + card.title.length,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}
