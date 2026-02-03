import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/icons/Icons';
import { TableData, ColumnDef, RowData } from '@/types';
import { generateId } from '@/utils/helpers';
import { evaluateFormula, isFormula } from '@/utils/formula';

interface TableEditorProps {
  table: TableData;
  onChange: (table: TableData) => void;
  maxColumns?: number;
  maxRows?: number;
}

export function TableEditor({ 
  table, 
  onChange, 
  maxColumns = 10,
  maxRows = 50 
}: TableEditorProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedColumns = [...table.columns].sort((a, b) => a.order - b.order);
  const sortedRows = [...table.rows].sort((a, b) => a.order - b.order);

  // Focus input when editing starts
  useEffect(() => {
    if ((editingCell || editingHeader) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell, editingHeader]);

  // Add new column
  const addColumn = () => {
    if (table.columns.length >= maxColumns) return;
    
    const newCol: ColumnDef = {
      id: generateId('col'),
      name: `Column ${table.columns.length + 1}`,
      order: table.columns.length
    };
    
    // Add empty cell to all rows
    const updatedRows = table.rows.map(row => ({
      ...row,
      cells: { ...row.cells, [newCol.id]: '' }
    }));
    
    onChange({
      ...table,
      columns: [...table.columns, newCol],
      rows: updatedRows
    });
  };

  // Remove column
  const removeColumn = (colId: string) => {
    if (table.columns.length <= 1) return;
    
    const updatedColumns = table.columns
      .filter(c => c.id !== colId)
      .map((c, i) => ({ ...c, order: i }));
    
    const updatedRows = table.rows.map(row => {
      const newCells = { ...row.cells };
      delete newCells[colId];
      return { ...row, cells: newCells };
    });
    
    onChange({
      ...table,
      columns: updatedColumns,
      rows: updatedRows
    });
  };

  // Update column name
  const updateColumnName = (colId: string, name: string) => {
    const updatedColumns = table.columns.map(c => 
      c.id === colId ? { ...c, name } : c
    );
    onChange({ ...table, columns: updatedColumns });
  };

  // Add new row
  const addRow = () => {
    if (table.rows.length >= maxRows) return;
    
    const cells: Record<string, string> = {};
    table.columns.forEach(col => {
      cells[col.id] = '';
    });
    
    const newRow: RowData = {
      id: generateId('row'),
      cells,
      order: table.rows.length
    };
    
    onChange({
      ...table,
      rows: [...table.rows, newRow]
    });
  };

  // Remove row
  const removeRow = (rowId: string) => {
    const updatedRows = table.rows
      .filter(r => r.id !== rowId)
      .map((r, i) => ({ ...r, order: i }));
    
    onChange({ ...table, rows: updatedRows });
  };

  // Update cell value
  const updateCell = (rowId: string, colId: string, value: string) => {
    const updatedRows = table.rows.map(row => 
      row.id === rowId 
        ? { ...row, cells: { ...row.cells, [colId]: value } }
        : row
    );
    onChange({ ...table, rows: updatedRows });
  };

  // Get column values for formula evaluation
  const getColumnValues = (colId: string, upToRowIndex: number): string[] => {
    return sortedRows
      .slice(0, upToRowIndex)
      .map(row => row.cells[colId] || '');
  };

  // Get cell display value (evaluate formula if needed)
  const getCellDisplay = (rowId: string, colId: string): { value: string; isFormula: boolean; formula?: string } => {
    const row = table.rows.find(r => r.id === rowId);
    if (!row) return { value: '', isFormula: false };
    
    const cellValue = row.cells[colId] || '';
    
    if (isFormula(cellValue)) {
      const rowIndex = sortedRows.findIndex(r => r.id === rowId);
      const columnValues = getColumnValues(colId, rowIndex);
      const calculated = evaluateFormula(cellValue, columnValues);
      return { value: calculated, isFormula: true, formula: cellValue };
    }
    
    return { value: cellValue, isFormula: false };
  };

  return (
    <div className="space-y-3">
      {/* Table Container with horizontal scroll */}
      <div 
        ref={tableRef}
        className="overflow-x-auto border border-[var(--border-primary)] rounded-lg"
      >
        <table className="w-full min-w-[400px] border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              {/* Row number header */}
              <th className="w-10 min-w-[40px] p-2 text-center text-xs font-medium text-[var(--text-tertiary)] border-b border-r border-[var(--border-primary)]">
                #
              </th>
              
              {/* Column headers */}
              {sortedColumns.map((col, colIndex) => (
                <th 
                  key={col.id}
                  className="min-w-[120px] p-0 border-b border-r border-[var(--border-primary)] last:border-r-0"
                >
                  <div className="flex items-center">
                    {editingHeader === col.id ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={col.name}
                        onChange={(e) => updateColumnName(col.id, e.target.value)}
                        onBlur={() => setEditingHeader(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditingHeader(null);
                          }
                        }}
                        className="flex-1 px-2 py-2 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingHeader(col.id)}
                        className="flex-1 px-2 py-2 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors truncate"
                        title="Click to edit"
                      >
                        {col.name || `Column ${colIndex + 1}`}
                      </button>
                    )}
                    
                    {table.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(col.id)}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger)] hover:bg-opacity-10 transition-colors"
                        title="Remove column"
                      >
                        <Icon.X size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              
              {/* Add column button */}
              {table.columns.length < maxColumns && (
                <th className="w-10 min-w-[40px] p-0 border-b border-[var(--border-primary)]">
                  <button
                    type="button"
                    onClick={addColumn}
                    className="w-full h-full p-2 text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:bg-[var(--primary)] hover:bg-opacity-10 transition-colors"
                    title="Add column"
                  >
                    <Icon.Plus size={16} className="mx-auto" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr key={row.id} className="group hover:bg-[var(--bg-tertiary)] hover:bg-opacity-50">
                {/* Row number with delete button */}
                <td className="p-1 text-center border-r border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] bg-opacity-50">
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-[var(--text-tertiary)] group-hover:hidden">
                      {rowIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="hidden group-hover:block p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                      title="Remove row"
                    >
                      <Icon.Trash size={12} />
                    </button>
                  </div>
                </td>
                
                {/* Cells */}
                {sortedColumns.map((col) => {
                  const cellDisplay = getCellDisplay(row.id, col.id);
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                  
                  return (
                    <td 
                      key={col.id}
                      className="p-0 border-r border-b border-[var(--border-primary)] last:border-r-0"
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={row.cells[col.id] || ''}
                          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingCell(null);
                              // Move to next row
                              const nextRowIndex = rowIndex + 1;
                              if (nextRowIndex < sortedRows.length) {
                                setEditingCell({ rowId: sortedRows[nextRowIndex].id, colId: col.id });
                              }
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              setEditingCell(null);
                              // Move to next column
                              const nextColIndex = sortedColumns.findIndex(c => c.id === col.id) + 1;
                              if (nextColIndex < sortedColumns.length) {
                                setEditingCell({ rowId: row.id, colId: sortedColumns[nextColIndex].id });
                              } else if (rowIndex + 1 < sortedRows.length) {
                                // Move to first column of next row
                                setEditingCell({ rowId: sortedRows[rowIndex + 1].id, colId: sortedColumns[0].id });
                              }
                            }
                          }}
                          className="w-full px-2 py-1.5 bg-[var(--bg-main)] text-sm text-[var(--text-primary)] outline-none ring-2 ring-[var(--primary)] ring-inset"
                          placeholder="Enter value or formula..."
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingCell({ rowId: row.id, colId: col.id })}
                          className={`w-full px-2 py-1.5 text-left text-sm transition-colors min-h-[32px] ${
                            cellDisplay.isFormula 
                              ? 'bg-[var(--primary)] bg-opacity-5' 
                              : 'hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          {cellDisplay.isFormula ? (
                            <div className="space-y-0.5">
                              <span className="text-[var(--primary)] font-medium">
                                {cellDisplay.value}
                              </span>
                              <span className="block text-[10px] text-[var(--text-tertiary)] font-mono">
                                {cellDisplay.formula}
                              </span>
                            </div>
                          ) : (
                            <span className={cellDisplay.value ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}>
                              {cellDisplay.value || '—'}
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
                
                {/* Empty cell for add column alignment */}
                {table.columns.length < maxColumns && (
                  <td className="border-b border-[var(--border-primary)]" />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      {table.rows.length < maxRows && (
        <button
          type="button"
          onClick={addRow}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] border border-dashed border-[var(--border-primary)] hover:border-[var(--primary)] rounded-lg transition-colors"
        >
          <Icon.Plus size={16} />
          Add Row
        </button>
      )}

      {/* Helper Text */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-tertiary)]">
        <span>📊 {table.columns.length}/{maxColumns} columns</span>
        <span>📋 {table.rows.length}/{maxRows} rows</span>
        <span className="text-[var(--primary)]">💡 Tip: Use formulas like sum//all, avg//3, dur//all</span>
      </div>

      {/* Formula Quick Reference */}
      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
          📖 Formula Reference
        </summary>
        <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-lg space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">sum//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">avg//3</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">max//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">min//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">cnt//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">dur//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">mnt//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">hrs//all</code>
            <code className="px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--primary)]">days//all</code>
          </div>
        </div>
      </details>
    </div>
  );
}
