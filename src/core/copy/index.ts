import { markdownToHtmlForClipboard, markdownToPlain } from '@/core/markdown';
import { evaluateFormula, isFormula } from '@/core/formula';
import type { Card, TableBody, TextBody } from '@/data/types';

export type CopyFormat = 'plain' | 'markdown' | 'html' | 'csv' | 'tsv' | 'mdtable';

export interface CopyPayload {
  plain: string;
  html?: string;
}

/** Copies via the async Clipboard API; falls back to a hidden textarea + execCommand for older WebKit. */
export async function writeClipboard(payload: CopyPayload): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      if (payload.html && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const item = new ClipboardItem({
          'text/plain': new Blob([payload.plain], { type: 'text/plain' }),
          'text/html': new Blob([payload.html], { type: 'text/html' }),
        });
        await navigator.clipboard.write([item]);
        return;
      }
      await navigator.clipboard.writeText(payload.plain);
      return;
    } catch {
      // fall through to legacy path
    }
  }
  if (typeof document === 'undefined') throw new Error('Clipboard unavailable');
  const ta = document.createElement('textarea');
  ta.value = payload.plain;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
  if (!ok) throw new Error('Clipboard unavailable');
}

export async function clearClipboardLater(seconds: number, expected: string): Promise<void> {
  if (!seconds || typeof navigator === 'undefined' || !navigator.clipboard) return;
  setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      if (current === expected) await navigator.clipboard.writeText('');
    } catch {
      // permission denied: nothing to do
    }
  }, seconds * 1000);
}

export function tableToRows(body: TableBody): { header: string[]; rows: string[][]; footer: string[] | null } {
  const cols = [...body.columns].sort((a, b) => (a.order < b.order ? -1 : 1));
  const rows = [...body.rows].sort((a, b) => (a.order < b.order ? -1 : 1));
  const header = cols.map((c) => c.name);
  const values = rows.map((r) => cols.map((c) => r.cells[c.id] ?? ''));
  const hasFooter = cols.some((c) => body.footer[c.id]);
  const footer = hasFooter
    ? cols.map((c, i) => {
        const f = body.footer[c.id];
        if (!f) return '';
        return evaluateFormula(f, values.map((row) => row[i] ?? ''));
      })
    : null;
  // Inline formula cells are evaluated against the values above them in the same column.
  const evaluated = values.map((row, ri) => row.map((cell, ci) => (isFormula(cell) ? evaluateFormula(cell, values.slice(0, ri).map((r) => r[ci] ?? '')) : cell)));
  return { header, rows: evaluated, footer };
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function tableToCsv(body: TableBody, sep: ',' | '\t' = ','): string {
  const { header, rows, footer } = tableToRows(body);
  const lines = [header, ...rows, ...(footer ? [footer] : [])];
  return lines.map((r) => r.map((c) => (sep === ',' ? csvCell(c) : c.replace(/\t/g, ' '))).join(sep)).join('\n');
}

export function tableToMarkdownText(body: TableBody): string {
  const { header, rows, footer } = tableToRows(body);
  const esc = (v: string) => v.replace(/\|/g, '\\|');
  const out = [`| ${header.map(esc).join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`)];
  if (footer) out.push(`| ${footer.map(esc).join(' | ')} |`);
  return out.join('\n');
}

export function tableToHtml(body: TableBody): string {
  const { header, rows, footer } = tableToRows(body);
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tr = (cells: string[], tag: 'th' | 'td') => `<tr>${cells.map((c) => `<${tag}>${esc(c)}</${tag}>`).join('')}</tr>`;
  return `<table><thead>${tr(header, 'th')}</thead><tbody>${rows.map((r) => tr(r, 'td')).join('')}</tbody>${footer ? `<tfoot>${tr(footer, 'td')}</tfoot>` : ''}</table>`;
}

/** Builds the clipboard payload of a card in a given format. `renderedText` is the text after template rendering. */
export function buildPayload(card: Card, format: CopyFormat, renderedText?: string): CopyPayload {
  if (card.type === 'table') {
    const body = card.body as TableBody;
    switch (format) {
      case 'tsv':
        return { plain: tableToCsv(body, '\t') };
      case 'mdtable':
      case 'markdown':
        return { plain: tableToMarkdownText(body) };
      case 'html':
        return { plain: tableToCsv(body, '\t'), html: tableToHtml(body) };
      case 'csv':
      default:
        return { plain: tableToCsv(body, ','), html: tableToHtml(body) };
    }
  }
  const md = renderedText ?? (card.body as TextBody).md;
  switch (format) {
    case 'markdown':
      return { plain: md };
    case 'html':
      return { plain: markdownToPlain(md), html: markdownToHtmlForClipboard(md) };
    case 'plain':
    default:
      return { plain: markdownToPlain(md) };
  }
}

export function defaultFormat(card: Card): CopyFormat {
  return card.type === 'table' ? 'csv' : 'plain';
}
