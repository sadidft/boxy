/**
 * Boxy Card Create/Edit Modal
 * Includes Table Editor for custom tables with formula support
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { X, Maximize2, Minimize2, Plus, Trash, GripVertical } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { parseMarkdown } from '@/utils/markdown';
import { generateId } from '@/utils/helpers';
import { isFormula, evaluateFormula } from '@/utils/formula';
import type { Card, TableData, ColumnDef, RowData } from '@/types';

interface CardModalProps {
  mode: 'create' | 'edit';
  card?: Card;
}

// ============ TableEditor Component ============
interface TableEditorProps {
  table: TableData;
  onChange: (table: TableData) => void;
  maxColumns: number;
}

function TableEditor({ table, onChange, maxColumns }: TableEditorProps) {
  const addColumn = useCallback(() => {
    if (table.columns.length >= maxColumns) return;
    
    const newColumn: ColumnDef = {
      id: generateId('col'),
      name: `Column ${table.columns.length + 1}`,
      order: table.columns.length
    };
    
    // Add empty cells for this column in all existing rows
    const updatedRows = table.rows.map(row => ({
      ...row,
      cells: { ...row.cells, [newColumn.id]: '' }
    }));
    
    onChange({
      ...table,
      columns: [...table.columns, newColumn],
      rows: updatedRows
    });
  }, [table, maxColumns, onChange]);

  const removeColumn = useCallback((colId: string) => {
    if (table.columns.length <= 1) return;
    
    const updatedColumns = table.columns
      .filter(c => c.id !== colId)
      .map((c, i) => ({ ...c, order: i }));
    
    // Remove cells for this column from all rows
    const updatedRows = table.rows.map(row => {
      const { [colId]: removed, ...remainingCells } = row.cells;
      return { ...row, cells: remainingCells };
    });
    
    onChange({
      ...table,
      columns: updatedColumns,
      rows: updatedRows
    });
  }, [table, onChange]);

  const updateColumnName = useCallback((colId: string, name: string) => {
    const updatedColumns = table.columns.map(c =>
      c.id === colId ? { ...c, name } : c
    );
    onChange({ ...table, columns: updatedColumns });
  }, [table, onChange]);

  const addRow = useCallback(() => {
    const emptyCells: Record<string, string> = {};
    table.columns.forEach(col => {
      emptyCells[col.id] = '';
    });
    
    const newRow: RowData = {
      id: generateId('row'),
      cells: emptyCells,
      order: table.rows.length
    };
    
    onChange({
      ...table,
      rows: [...table.rows, newRow]
    });
  }, [table, onChange]);

  const removeRow = useCallback((rowId: string) => {
    const updatedRows = table.rows
      .filter(r => r.id !== rowId)
      .map((r, i) => ({ ...r, order: i }));
    
    onChange({ ...table, rows: updatedRows });
  }, [table, onChange]);

  const updateCell = useCallback((rowId: string, colId: string, value: string) => {
    const updatedRows = table.rows.map(row =>
      row.id === rowId
        ? { ...row, cells: { ...row.cells, [colId]: value } }
        : row
    );
    onChange({ ...table, rows: updatedRows });
  }, [table, onChange]);

  // Get values for formula evaluation (all values above current row in same column)
  const getColumnValuesAbove = useCallback((colId: string, currentRowIndex: number): string[] => {
    return table.rows
      .slice(0, currentRowIndex)
      .map(row => row.cells[colId] || '');
  }, [table.rows]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          Custom Table Editor
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addColumn}
            disabled={table.columns.length >= maxColumns}
          >
            <Plus size={14} className="mr-1" />
            Column
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addRow}
          >
            <Plus size={14} className="mr-1" />
            Row
          </Button>
        </div>
      </div>

      <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header Row - Column Names */}
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th className="w-8 p-2 border-r border-[var(--border-primary)]">
                  <GripVertical size={14} className="text-[var(--text-tertiary)] mx-auto" />
                </th>
                {table.columns.map((col) => (
                  <th 
                    key={col.id}
                    className="p-0 border-r border-[var(--border-primary)] last:border-r-0 min-w-[120px]"
                  >
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => updateColumnName(col.id, e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-transparent text-[var(--text-primary)] text-center font-medium outline-none focus:bg-[var(--bg-main)]"
                        placeholder="Column name"
                      />
                      {table.columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(col.id)}
                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                          title="Remove column"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10 p-2">
                  {/* Actions column */}
                </th>
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody>
              {table.rows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={table.columns.length + 2} 
                    className="p-4 text-center text-[var(--text-tertiary)]"
                  >
                    No rows yet. Click "+ Row" to add one.
                  </td>
                </tr>
              ) : (
                table.rows.map((row, rowIndex) => (
                  <tr 
                    key={row.id}
                    className="border-t border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]/50"
                  >
                    <td className="w-8 p-2 border-r border-[var(--border-primary)] text-center text-[var(--text-tertiary)] text-xs">
                      {rowIndex + 1}
                    </td>
                    {table.columns.map((col) => {
                      const cellValue = row.cells[col.id] || '';
                      const isFormulaCell = isFormula(cellValue);
                      const calculatedValue = isFormulaCell 
                        ? evaluateFormula(cellValue, getColumnValuesAbove(col.id, rowIndex))
                        : null;

                      return (
                        <td 
                          key={col.id}
                          className="p-0 border-r border-[var(--border-primary)] last:border-r-0"
                        >
                          <div className="relative">
                            <input
                              type="text"
                              value={cellValue}
                              onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                              className={cn(
                                "w-full px-2 py-1.5 bg-transparent text-[var(--text-primary)] outline-none focus:bg-[var(--bg-main)]",
                                isFormulaCell && "text-[var(--primary)] font-mono text-xs"
                              )}
                              placeholder="Enter value or formula"
                            />
                            {isFormulaCell && calculatedValue && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1 rounded pointer-events-none">
                                = {calculatedValue}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="w-10 p-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                        title="Remove row"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Help */}
      <p className="text-xs text-[var(--text-tertiary)]">
        <span className="text-[var(--primary)]">Tip:</span> Use formulas like{' '}
        <code className="bg-[var(--bg-tertiary)] px-1 rounded">sum//all</code>,{' '}
        <code className="bg-[var(--bg-tertiary)] px-1 rounded">avg//3</code>,{' '}
        <code className="bg-[var(--bg-tertiary)] px-1 rounded">dur//all</code>{' '}
        to calculate values automatically.
      </p>
    </div>
  );
}

// ============ Main CardModal Component ============
export function CardModal({ mode, card }: CardModalProps) {
  const { state, dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(card?.title || '');
  const [content, setContent] = useState(card?.content || '');
  const [tags, setTags] = useState<string[]>(card?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tableMode, setTableMode] = useState<'history' | 'custom'>(card?.table?.mode || 'history');
  const [customTable, setCustomTable] = useState<TableData>(() => {
    if (card?.table?.mode === 'custom') {
      return card.table;
    }
    // Default empty custom table with one column
    return {
      mode: 'custom',
      columns: [
        { id: generateId('col'), name: 'Column 1', order: 0 }
      ],
      rows: []
    };
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Autofocus title input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Tag suggestions
  const tagSuggestions = useMemo(() => {
    if (!tagInput) return [];
    return state.allTags
      .filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
      .slice(0, 5);
  }, [tagInput, state.allTags, tags]);

  const handleAddTag = useCallback((tag: string) => {
    const trimmed = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  }, [tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(tags.filter(t => t !== tag));
  }, [tags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  }, [tagInput, tags, handleAddTag, handleRemoveTag]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      error('Card title is required');
      return;
    }

    if (!content.trim()) {
      error('Card content is required');
      return;
    }

    if (!state.activeTabId) {
      error('No active tab');
      return;
    }

    // Prepare table data based on mode
    let table: TableData | null = null;
    
    if (tableMode === 'history') {
      table = { mode: 'history', columns: [], rows: [] };
    } else {
      // Use custom table data
      table = {
        ...customTable,
        mode: 'custom'
      };
    }

    if (mode === 'create') {
      dispatch({ 
        type: 'CREATE_CARD', 
        payload: { 
          tabId: state.activeTabId,
          title: title.trim(),
          content: content.trim(),
          tags,
          pinned: false,
          table
        } 
      });
      success('Card created');
    } else if (card) {
      dispatch({ 
        type: 'UPDATE_CARD', 
        payload: { 
          id: card.id, 
          updates: { 
            title: title.trim(),
            content: content.trim(),
            tags,
            table
          } 
        } 
      });
      success('Card updated');
    }
    
    closeModal();
  }, [title, content, tags, tableMode, customTable, mode, card, state.activeTabId, dispatch, closeModal, success, error]);

  const handleDelete = useCallback(() => {
    if (card) {
      openModal('deleteConfirm', { type: 'card', id: card.id, name: card.title });
    }
  }, [card, openModal]);

  // Preview content
  const previewHtml = useMemo(() => parseMarkdown(content), [content]);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title={mode === 'create' ? 'Create Card' : 'Edit Card'}
      size={isExpanded ? 'full' : 'lg'}
      footer={
        <>
          {mode === 'edit' && (
            <Button variant="danger" onClick={handleDelete} className="mr-auto">
              Delete Card
            </Button>
          )}
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'create' ? 'Create Card' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="card-title" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Title
          </label>
          <input
            ref={titleInputRef}
            id="card-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="card-content" className="text-sm font-medium text-[var(--text-secondary)]">
              Content
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          
          {showPreview ? (
            <div 
              className="w-full min-h-[200px] max-h-[400px] overflow-y-auto p-3 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              id="card-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content here... Markdown supported. Use {{variable}} for dynamic values."
              className={cn(
                'w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg',
                'text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm',
                'outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20',
                'resize-none',
                isExpanded ? 'min-h-[400px]' : 'min-h-[200px]'
              )}
            />
          )}
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Supports Markdown. Use {'{{variable}}'} for custom prompts, {'{{date}}'}, {'{{time}}'} for auto-fill.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg min-h-[42px]">
            {tags.map(tag => (
              <span 
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-sm rounded-full"
              >
                #{tag}
                <button 
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? 'Add tags...' : ''}
              className="flex-1 min-w-[100px] bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
            />
          </div>
          
          {/* Tag suggestions */}
          {tagSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tagSuggestions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-0.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-full transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Table
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tableMode"
                value="history"
                checked={tableMode === 'history'}
                onChange={() => setTableMode('history')}
                className="text-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">History (auto-record actions)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tableMode"
                value="custom"
                checked={tableMode === 'custom'}
                onChange={() => setTableMode('custom')}
                className="text-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Custom table</span>
            </label>
          </div>

          {/* Custom Table Editor */}
          {tableMode === 'custom' && (
            <TableEditor
              table={customTable}
              onChange={setCustomTable}
              maxColumns={state.settings.limits.maxColumnsPerTable}
            />
          )}

          {/* History Mode Info */}
          {tableMode === 'history' && (
            <p className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] p-3 rounded-lg">
              History mode automatically records when the card is created, edited, or copied.
              The table will display the last 4 actions with timestamps.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
