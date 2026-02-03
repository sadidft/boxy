/**
 * Boxy Card Item Component
 * Individual card display with actions and table rendering
 */

import React, { useCallback, useMemo } from 'react';
import type { Card, TableData, HistoryEntry } from '@/types';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { 
  GripVertical, 
  Pin,
  Edit, 
  Trash,
  Copy
} from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { parseMarkdown } from '@/utils/markdown';
import { formatRelativeTime, formatHistoryTimestamp } from '@/utils/helpers';
import { hasCustomVariables, getCustomVariables, processContentForCopy } from '@/utils/variables';
import { evaluateFormula, isFormula } from '@/utils/formula';

interface CardItemProps {
  card: Card;
  isSelected: boolean;
  isDragging: boolean;
  searchQuery: string;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
  onDrop: (targetCardId: string) => void;
}

/**
 * Renders history table showing last 4 card activity entries
 */
function HistoryTable({ history }: { history: HistoryEntry[] }) {
  // Show last 4 entries, most recent first
  const entries = [...history].reverse().slice(0, 4);
  const hasMore = history.length > 4;

  if (entries.length === 0) {
    return (
      <div className="text-xs text-[var(--text-tertiary)] italic">
        No history yet
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-[var(--border-primary)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[var(--bg-tertiary)]">
            <th className="py-1.5 px-2 text-left font-medium text-[var(--text-secondary)]">
              Timestamp
            </th>
            <th className="py-1.5 px-2 text-left font-medium text-[var(--text-secondary)]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr 
              key={`${entry.timestamp}-${i}`} 
              className="border-t border-[var(--border-primary)]"
            >
              <td className="py-1.5 px-2 text-[var(--text-tertiary)] font-mono">
                {formatHistoryTimestamp(entry.timestamp)}
              </td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] capitalize">
                {entry.action}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="py-1 px-2 text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]">
          +{history.length - 4} more entries
        </div>
      )}
    </div>
  );
}

/**
 * Renders custom table with formula evaluation
 */
function CustomTable({ table }: { table: TableData }) {
  const { columns, rows } = table;
  
  // Sort columns and rows by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const sortedRows = [...rows].sort((a, b) => a.order - b.order);
  
  // Show max 4 rows in preview
  const displayRows = sortedRows.slice(0, 4);
  const hasMore = sortedRows.length > 4;

  if (sortedColumns.length === 0) {
    return (
      <div className="text-xs text-[var(--text-tertiary)] italic">
        Empty table
      </div>
    );
  }

  /**
   * Get cell value, evaluating formulas if needed
   */
  const getCellValue = (rowIndex: number, columnId: string): { value: string; isFormula: boolean; formula: string } => {
    const row = sortedRows[rowIndex];
    const cellValue = row?.cells[columnId] || '';
    
    if (isFormula(cellValue)) {
      // Collect all values above this row in the same column
      const columnValues: string[] = [];
      for (let i = 0; i < rowIndex; i++) {
        const val = sortedRows[i]?.cells[columnId] || '';
        // Don't include formula cells in the calculation values
        if (!isFormula(val)) {
          columnValues.push(val);
        }
      }
      
      const result = evaluateFormula(cellValue, columnValues);
      return { value: result, isFormula: true, formula: cellValue };
    }
    
    return { value: cellValue, isFormula: false, formula: '' };
  };

  return (
    <div className="overflow-hidden rounded border border-[var(--border-primary)]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              {sortedColumns.map(col => (
                <th 
                  key={col.id}
                  className="py-1.5 px-2 text-left font-medium text-[var(--text-secondary)] whitespace-nowrap"
                >
                  {col.name || 'Untitled'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr 
                key={row.id}
                className="border-t border-[var(--border-primary)]"
              >
                {sortedColumns.map(col => {
                  const { value, isFormula: isFormulaCell, formula } = getCellValue(rowIndex, col.id);
                  
                  return (
                    <td 
                      key={col.id}
                      className={cn(
                        "py-1.5 px-2 whitespace-nowrap",
                        isFormulaCell 
                          ? "text-[var(--primary)] font-medium"
                          : "text-[var(--text-secondary)]"
                      )}
                      title={isFormulaCell ? `Formula: ${formula}` : undefined}
                    >
                      <div className="flex flex-col">
                        <span>{value || '—'}</span>
                        {isFormulaCell && (
                          <span className="text-[10px] text-[var(--text-tertiary)] font-mono opacity-60">
                            {formula}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="py-1 px-2 text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]">
          +{sortedRows.length - 4} more rows
        </div>
      )}
    </div>
  );
}

/**
 * Card table display component - renders either history or custom table
 */
function CardTableDisplay({ card }: { card: Card }) {
  if (!card.table) return null;

  return (
    <div className="px-3 pb-2">
      <div className="text-xs text-[var(--text-tertiary)] mb-1.5 flex items-center gap-1">
        <span>📊</span>
        <span>{card.table.mode === 'history' ? 'History' : 'Table'}</span>
      </div>
      {card.table.mode === 'history' ? (
        <HistoryTable history={card.history} />
      ) : (
        <CustomTable table={card.table} />
      )}
    </div>
  );
}

export function CardItem({ 
  card, 
  isSelected, 
  isDragging,
  searchQuery,
  onDragStart, 
  onDragEnd, 
  onDrop 
}: CardItemProps) {
  const { state, dispatch } = useApp();
  const { openModal } = useModal();
  const { success, error } = useToast();
  const [justCopied, setJustCopied] = React.useState(false);

  // Parse and highlight content
  const renderedContent = useMemo(() => {
    let html = parseMarkdown(card.content);
    
    // Highlight search matches
    if (searchQuery) {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
      html = html.replace(regex, '<mark class="bg-yellow-300/30 text-inherit">$1</mark>');
    }
    
    return html;
  }, [card.content, searchQuery]);

  const handleCopy = useCallback(async () => {
    try {
      // Check for custom variables
      if (hasCustomVariables(card.content)) {
        const customVars = getCustomVariables(card.content);
        openModal('variableInput', { card, customVars });
        return;
      }
      
      // Process and copy
      const processed = await processContentForCopy(card.content);
      await navigator.clipboard.writeText(processed);
      
      // Update stats
      dispatch({ type: 'INCREMENT_COPY_COUNT', payload: card.id });
      
      // Show visual feedback
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
      
      success('Copied to clipboard');
    } catch (err) {
      error('Failed to copy');
    }
  }, [card, dispatch, openModal, success, error]);
  
  // Double-click to quick copy
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleCopy();
  }, [handleCopy]);

  const handleEdit = useCallback(() => {
    openModal('editCard', card);
  }, [openModal, card]);

  const handleDelete = useCallback(() => {
    openModal('deleteConfirm', { type: 'card', id: card.id, name: card.title });
  }, [openModal, card]);

  const handleTogglePin = useCallback(() => {
    dispatch({ 
      type: 'UPDATE_CARD', 
      payload: { id: card.id, updates: { pinned: !card.pinned } } 
    });
  }, [dispatch, card]);

  const handleSelect = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_CARD', payload: card.id });
  }, [dispatch, card.id]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    onDragStart(card.id);
  }, [card.id, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop(card.id);
  }, [card.id, onDrop]);

  // Check if table should be displayed
  const showTable = card.table && state.settings.features.tableInCards;

  return (
    <div
      role="article"
      tabIndex={0}
      className={cn(
        'group relative flex flex-col bg-[var(--bg-secondary)] rounded-lg border transition-all',
        isSelected 
          ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
          : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]',
        card.pinned && 'border-l-2 border-l-[var(--primary)]',
        isDragging && 'opacity-50 rotate-1 scale-105',
        justCopied && 'ring-2 ring-[var(--success)]/50',
        'hover:shadow-md'
      )}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      draggable={state.settings.features.cardDragDrop}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      title="Double-click to quick copy"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-[var(--border-primary)]">
        {/* Drag handle */}
        {state.settings.features.cardDragDrop && (
          <div 
            className="opacity-0 group-hover:opacity-100 cursor-grab text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-opacity"
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
        )}
        
        {/* Title */}
        <h3 className="flex-1 font-semibold text-[var(--text-primary)] truncate">
          {card.title}
        </h3>
        
        {/* Pin indicator */}
        {card.pinned && (
          <Pin size={14} filled className="text-[var(--primary)] flex-shrink-0" />
        )}
      </div>

      {/* Content preview */}
      <div 
        className="p-3 text-sm text-[var(--text-secondary)] overflow-hidden"
        style={{ maxHeight: '150px' }}
      >
        <div 
          className="prose prose-sm prose-invert max-w-none line-clamp-5"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {card.tags.slice(0, 5).map(tag => (
            <span 
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--border-primary)] text-[var(--text-primary)] text-xs font-medium rounded-full hover:bg-opacity-20 transition-colors cursor-default"
              title={`Tag: ${tag}`}
            >
              <span className="opacity-60">#</span>
              {tag}
            </span>
          ))}
          {card.tags.length > 5 && (
            <span 
              className="inline-flex items-center px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs rounded-full"
              title={`More tags: ${card.tags.slice(5).join(', ')}`}
            >
              +{card.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Table Display (History or Custom) */}
      {showTable && <CardTableDisplay card={card} />}

      {/* Actions */}
      <div className="flex items-center gap-1 p-2 border-t border-[var(--border-primary)] mt-auto">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
          aria-label="Copy"
        >
          <Copy size={14} />
          <span>Copy</span>
        </button>
        
        <button
          onClick={handleEdit}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
          aria-label="Edit"
        >
          <Edit size={14} />
        </button>
        
        <button
          onClick={handleTogglePin}
          className={cn(
            'p-1.5 rounded transition-colors',
            card.pinned
              ? 'text-[var(--primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          )}
          aria-label={card.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={14} filled={card.pinned} />
        </button>
        
        <button
          onClick={handleDelete}
          className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
          aria-label="Delete"
        >
          <Trash size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="px-3 pb-2 text-xs text-[var(--text-tertiary)]">
        {card.copyCount > 0 && `${card.copyCount}× copied • `}
        {formatRelativeTime(card.updatedAt)}
      </div>
    </div>
  );
}
