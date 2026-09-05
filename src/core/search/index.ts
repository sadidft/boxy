import MiniSearch, { type SearchResult } from 'minisearch';
import type { CardIndex } from '@/data/types';

/**
 * Lightweight global search over the Dexie card index (title, preview, tags).
 * Runs on the main thread; the index is small (one row per card, preview capped) and rebuilt
 * when the live query changes. A worker-based index can replace this later without touching callers.
 */
export interface SearchDoc {
  id: string;
  boxId: string;
  tabId: string;
  type: CardIndex['type'];
  title: string;
  preview: string;
  tags: string;
}

export interface ParsedQuery {
  text: string;
  tags: string[];
  box?: string;
  type?: 'text' | 'table';
  is: Set<'pinned' | 'template' | 'recent'>;
}

export function parseQuery(raw: string): ParsedQuery {
  const out: ParsedQuery = { text: '', tags: [], is: new Set() };
  const words: string[] = [];
  for (const tok of raw.trim().split(/\s+/).filter(Boolean)) {
    const lower = tok.toLowerCase();
    if (lower.startsWith('#') && lower.length > 1) out.tags.push(lower.slice(1));
    else if (lower.startsWith('@') && lower.length > 1) out.box = lower.slice(1);
    else if (lower === 'type:table' || lower === 'type:text') out.type = lower.slice(5) as 'text' | 'table';
    else if (lower === 'is:pinned' || lower === 'is:template' || lower === 'is:recent') out.is.add(lower.slice(3) as 'pinned' | 'template' | 'recent');
    else words.push(tok);
  }
  out.text = words.join(' ');
  return out;
}

export function buildIndex(rows: CardIndex[]): MiniSearch<SearchDoc> {
  const ms = new MiniSearch<SearchDoc>({
    fields: ['title', 'preview', 'tags'],
    storeFields: ['id', 'boxId', 'tabId', 'type', 'title'],
    searchOptions: { boost: { title: 3, tags: 2 }, fuzzy: 0.2, prefix: true, combineWith: 'AND' },
  });
  ms.addAll(rows.map((r) => ({ id: r.id, boxId: r.boxId, tabId: r.tabId, type: r.type, title: r.title, preview: r.preview.slice(0, 20_000), tags: r.tags.join(' ') })));
  return ms;
}

export interface SearchHit {
  row: CardIndex;
  score: number;
}

export function searchIndex(ms: MiniSearch<SearchDoc> | null, rows: CardIndex[], boxNames: Map<string, string>, raw: string, limit = 50, now = Date.now()): SearchHit[] {
  const q = parseQuery(raw);
  const byId = new Map(rows.map((r) => [r.id, r]));
  let candidates: SearchHit[];
  if (q.text && ms) {
    const res: SearchResult[] = ms.search(q.text);
    candidates = res.map((r) => ({ row: byId.get(String(r.id))!, score: r.score })).filter((h) => Boolean(h.row));
  } else {
    candidates = rows.map((r) => ({ row: r, score: (r.lastCopiedAt ?? 0) / 1e12 + r.copyCount / 1e3 + (r.pinned ? 1 : 0) }));
    candidates.sort((a, b) => b.score - a.score);
  }
  const filtered = candidates.filter(({ row }) => {
    if (q.tags.length && !q.tags.every((t) => row.tags.some((x) => x.toLowerCase().includes(t)))) return false;
    if (q.type && row.type !== q.type) return false;
    if (q.box) {
      const name = (boxNames.get(row.boxId) ?? '').toLowerCase();
      if (!name.includes(q.box)) return false;
    }
    if (q.is.has('pinned') && !row.pinned) return false;
    if (q.is.has('template') && !row.hasVars) return false;
    if (q.is.has('recent') && (row.lastCopiedAt ?? 0) < now - 7 * 86_400_000 && row.updatedAt < now - 7 * 86_400_000) return false;
    return true;
  });
  return filtered.slice(0, limit);
}
