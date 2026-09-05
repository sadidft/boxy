import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnType, TableBody, TableColumn, TableRow } from '@/data/types';
import { keyAfterAll, keysBetween, sortByOrder } from '@/data/order';
import { evaluateFormula, formulaGuide, isFormula } from '@/core/formula';
import { newId } from '@/data/ids';
import { Icon } from '@/components/ui/Icon';
import { Button, IconButton, Menu, type MenuItemSpec } from '@/components/ui/primitives';

const COLUMN_TYPES: ColumnType[] = ['text', 'number', 'date', 'time', 'formula'];

export function TableEditor({ value, onChange }: { value: TableBody; onChange: (next: TableBody) => void }) {
  const { t } = useTranslation();
  const [guideOpen, setGuideOpen] = useState(false);
  const columns = useMemo(() => sortByOrder(value.columns), [value.columns]);
  const rows = useMemo(() => sortByOrder(value.rows), [value.rows]);

  const update = (patch: Partial<TableBody>) => onChange({ ...value, ...patch });

  const addColumn = () => {
    const col: TableColumn = { id: newId(), name: `${t('cards.columnName')} ${columns.length + 1}`, type: 'text', order: keyAfterAll(columns.map((c) => c.order)) };
    update({ columns: [...value.columns, col] });
  };
  const addRow = (count = 1) => {
    const keys = keysBetween(rows[rows.length - 1]?.order ?? null, null, count);
    const added: TableRow[] = keys.map((k) => ({ id: newId(), order: k, cells: {} }));
    update({ rows: [...value.rows, ...added] });
  };
  const setCell = (rowId: string, colId: string, v: string) => update({ rows: value.rows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: v } } : r)) });
  const setColumn = (colId: string, patch: Partial<TableColumn>) => update({ columns: value.columns.map((c) => (c.id === colId ? { ...c, ...patch } : c)) });
  const removeColumn = (colId: string) => {
    const footer = { ...value.footer };
    delete footer[colId];
    update({ columns: value.columns.filter((c) => c.id !== colId), rows: value.rows.map((r) => ({ ...r, cells: Object.fromEntries(Object.entries(r.cells).filter(([k]) => k !== colId)) })), footer });
  };
  const removeRow = (rowId: string) => update({ rows: value.rows.filter((r) => r.id !== rowId) });
  const moveColumn = (colId: string, dir: -1 | 1) => {
    const i = columns.findIndex((c) => c.id === colId);
    const j = i + dir;
    if (j < 0 || j >= columns.length) return;
    const next = [...columns];
    [next[i], next[j]] = [next[j]!, next[i]!];
    const keys = keysBetween(null, null, next.length);
    update({ columns: next.map((c, k) => ({ ...c, order: keys[k]! })) });
  };
  const setFooter = (colId: string, v: string) => {
    const footer = { ...value.footer };
    if (v.trim()) footer[colId] = v.trim();
    else delete footer[colId];
    update({ footer });
  };

  const onPaste = (e: React.ClipboardEvent, rowIndex: number, colIndex: number) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !text.includes('\n')) return;
    e.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n').filter((l, i, a) => l.length || i < a.length - 1);
    let nextRows = sortByOrder(value.rows);
    const needed = rowIndex + lines.length - nextRows.length;
    if (needed > 0) {
      const keys = keysBetween(nextRows[nextRows.length - 1]?.order ?? null, null, needed);
      nextRows = [...nextRows, ...keys.map((k) => ({ id: newId(), order: k, cells: {} }))];
    }
    lines.forEach((line, li) => {
      const cells = line.split('\t');
      const row = nextRows[rowIndex + li]!;
      const updated = { ...row.cells };
      cells.forEach((cell, ci) => {
        const col = columns[colIndex + ci];
        if (col) updated[col.id] = cell;
      });
      nextRows[rowIndex + li] = { ...row, cells: updated };
    });
    update({ rows: nextRows });
  };

  const columnValues = (colId: string, uptoRow: number) => rows.slice(0, uptoRow).map((r) => r.cells[colId] ?? '');

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" icon="plus" onClick={addColumn}>
          {t('cards.addColumn')}
        </Button>
        <Button size="sm" icon="plus" onClick={() => addRow(1)} disabled={!columns.length}>
          {t('cards.addRow')}
        </Button>
        <button type="button" className="ml-auto flex items-center gap-1 text-[0.85em] text-muted hover:text-text" onClick={() => setGuideOpen((o) => !o)} aria-expanded={guideOpen}>
          <Icon name="circle-help" size={14} /> {t('formula.guide')}
        </button>
      </div>
      {guideOpen ? (
        <div className="grid gap-2 rounded-control border border-line bg-bg p-2 text-[0.85em] sm:grid-cols-2">
          {formulaGuide.map((g) => (
            <div key={g.category}>
              <div className="mb-0.5 font-semibold text-muted">{t(`formula.${g.category}`)}</div>
              {g.entries.map((e) => (
                <div key={e.key} className="flex gap-2">
                  <code className="shrink-0 text-accent">{e.syntax}</code>
                  <span className="text-dim">{t(`formula.${e.key}`)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="text-dim sm:col-span-2">{t('formula.rangeHint')}</div>
        </div>
      ) : null}
      {columns.length ? (
        <div className="overflow-x-auto rounded-control border border-line">
          <table className="w-full min-w-[480px] border-collapse text-[0.95em]">
            <thead>
              <tr className="bg-surface2/50">
                <th className="w-8" />
                {columns.map((col) => (
                  <th key={col.id} className="border-b border-l border-line p-1 text-left align-top font-normal">
                    <div className="flex items-center gap-1">
                      <input className="input h-7 min-w-0 flex-1 px-1.5 font-semibold" value={col.name} onChange={(e) => setColumn(col.id, { name: e.target.value })} aria-label={t('cards.columnName')} />
                      <ColumnMenu col={col} onType={(type) => setColumn(col.id, { type })} onMove={(d) => moveColumn(col.id, d)} onRemove={() => removeColumn(col.id)} />
                    </div>
                    <div className="mt-0.5 text-[0.75em] tracking-wide text-dim uppercase">{t(`cards.col${col.type[0]!.toUpperCase()}${col.type.slice(1)}`)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.id} className="group">
                  <td className="border-b border-line text-center text-[0.8em] text-dim">
                    <span className="group-hover:hidden">{ri + 1}</span>
                    <button type="button" className="hidden text-danger group-hover:inline" aria-label={t('cards.deleteRow')} onClick={() => removeRow(row.id)}>
                      <Icon name="x" size={12} />
                    </button>
                  </td>
                  {columns.map((col, ci) => {
                    const v = row.cells[col.id] ?? '';
                    const computed = isFormula(v) ? evaluateFormula(v, columnValues(col.id, ri)) : null;
                    return (
                      <td key={col.id} className="border-b border-l border-line p-0 align-top">
                        <div className="relative">
                          <input
                            className={`h-8 w-full bg-transparent px-2 outline-none focus:bg-accent-soft/40 ${col.type === 'number' ? 'text-right font-ui' : ''}`}
                            value={v}
                            inputMode={col.type === 'number' ? 'decimal' : undefined}
                            type={col.type === 'date' ? 'date' : col.type === 'time' ? 'time' : 'text'}
                            onChange={(e) => setCell(row.id, col.id, e.target.value)}
                            onPaste={(e) => onPaste(e, ri, ci)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && ri === rows.length - 1) {
                                e.preventDefault();
                                addRow(1);
                              }
                            }}
                            aria-label={`${col.name} ${ri + 1}`}
                          />
                          {computed !== null ? <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[0.8em] text-accent">= {computed || t('formula.empty')}</span> : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-surface2/30">
                <td className="text-center text-dim" title={t('cards.footerFormula')}>
                  <Icon name="variable" size={13} className="inline" />
                </td>
                {columns.map((col) => {
                  const f = value.footer[col.id] ?? '';
                  const computed = f ? evaluateFormula(f, columnValues(col.id, rows.length)) : '';
                  return (
                    <td key={col.id} className="border-l border-line p-0">
                      <div className="flex items-center">
                        <input className="h-8 min-w-0 flex-1 bg-transparent px-2 font-ui text-[0.9em] outline-none placeholder:text-dim/60 focus:bg-accent-soft/40" value={f} placeholder="sum//all" onChange={(e) => setFooter(col.id, e.target.value)} aria-label={`${t('cards.footerFormula')} ${col.name}`} />
                        {f ? <span className="pr-2 text-[0.9em] font-semibold text-accent">{computed || t('formula.empty')}</span> : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-control border border-dashed border-line-strong p-4 text-center text-[0.9em] text-dim">{t('cards.noColumns')}</p>
      )}
      <p className="text-[0.8em] text-dim">{t('cards.pasteRows')}: Ctrl+V</p>
    </div>
  );
}

function ColumnMenu({ col, onType, onMove, onRemove }: { col: TableColumn; onType: (t: ColumnType) => void; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const { t } = useTranslation();
  const items: MenuItemSpec[] = [
    {
      id: 'type',
      label: t('cards.columnType'),
      icon: 'rows-3',
      children: COLUMN_TYPES.map((ty) => ({ id: ty, label: t(`cards.col${ty[0]!.toUpperCase()}${ty.slice(1)}`), checked: col.type === ty, onSelect: () => onType(ty) })),
    },
    { id: 'left', label: t('shell.moveLeft'), icon: 'arrow-left', onSelect: () => onMove(-1) },
    { id: 'right', label: t('shell.moveRight'), icon: 'arrow-right', onSelect: () => onMove(1) },
    { id: 'remove', label: t('cards.deleteColumn'), icon: 'trash-2', danger: true, separatorBefore: true, onSelect: onRemove },
  ];
  return <Menu label={`${col.name}: ${t('common.menu')}`} trigger={<IconButton icon="ellipsis-vertical" label={t('common.menu')} tooltip={false} style={{ width: 24, height: 24 }} />} items={items} />;
}
