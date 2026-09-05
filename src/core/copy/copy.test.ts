import { describe, expect, it } from 'vitest';
import { buildPayload, tableToCsv, tableToMarkdownText, tableToRows } from './index';
import type { Card, TableBody } from '@/data/types';

const table: TableBody = {
  columns: [
    { id: 'd', name: 'Date', type: 'date', order: 'a0' },
    { id: 'h', name: 'Hours', type: 'number', order: 'a1' },
  ],
  rows: [
    { id: 'r1', cells: { d: '2026-09-02', h: '3.5' }, order: 'a0' },
    { id: 'r2', cells: { d: '2026-09-03', h: '2' }, order: 'a1' },
    { id: 'r3', cells: { d: 'a "quoted", cell', h: 'sum//all' }, order: 'a2' },
  ],
  footer: { h: 'sum//all' },
};

const card = (type: Card['type'], body: Card['body']): Card => ({
  id: 'c',
  boxId: 'b',
  tabId: 't',
  type,
  title: 'T',
  body,
  tags: [],
  pinned: false,
  order: 'a0',
  vars: {},
  stats: { copyCount: 0, openCount: 0 },
  rev: 0,
  createdAt: 0,
  updatedAt: 0,
});

describe('copy pipeline', () => {
  it('evaluates formulas in rows and footers', () => {
    const { rows, footer } = tableToRows(table);
    expect(rows[2]).toEqual(['a "quoted", cell', '5.50']);
    expect(footer).toEqual(['', '5.50']);
  });

  it('serialises CSV, TSV and Markdown', () => {
    expect(tableToCsv(table)).toBe('Date,Hours\n2026-09-02,3.5\n2026-09-03,2\n"a ""quoted"", cell",5.50\n,5.50');
    expect(tableToCsv(table, '\t').split('\n')[1]).toBe('2026-09-02\t3.5');
    expect(tableToMarkdownText(table).split('\n')[0]).toBe('| Date | Hours |');
  });

  it('builds payloads per card type', () => {
    const text = card('text', { md: '# Hi\n\n**bold**' });
    expect(buildPayload(text, 'plain').plain).toBe('Hi\n\nbold');
    expect(buildPayload(text, 'markdown').plain).toBe('# Hi\n\n**bold**');
    expect(buildPayload(text, 'html').html).toContain('<strong>bold</strong>');
    expect(buildPayload(text, 'plain', 'rendered').plain).toBe('rendered');
    const tbl = card('table', table);
    expect(buildPayload(tbl, 'csv').html).toContain('<table>');
    expect(buildPayload(tbl, 'tsv').plain).toContain('\t');
  });
});
