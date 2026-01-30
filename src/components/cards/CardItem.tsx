/**
 * Boxy Card Item Component
 * Individual card display with actions
 */

import React, { useCallback, useMemo } from 'react';
import type { Card } from '@/types';
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

interface CardItemProps {
  card: Card;
  isSelected: boolean;
  isDragging: boolean;
  searchQuery: string;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
  onDrop: (targetCardId: string) => void;
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

  // Parse and highlight content
  const renderedContent = useMemo(() => {
    let html = parseMarkdown(card.content);
    
    // Highlight search matches
    if (searchQuery) {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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
      success('Copied to clipboard');
    } catch (err) {
      error('Failed to copy');
    }
  }, [card, dispatch, openModal, success, error]);

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
        'hover:shadow-md'
      )}
      onClick={handleSelect}
      draggable={state.settings.features.cardDragDrop}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
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
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {card.tags.slice(0, 5).map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
          {card.tags.length > 5 && (
            <span className="px-2 py-0.5 text-[var(--text-tertiary)] text-xs">
              +{card.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Table preview (history mode) */}
      {card.table?.mode === 'history' && state.settings.features.tableInCards && card.history.length > 0 && (
        <div className="px-3 pb-2">
          <table className="w-full text-xs">
            <tbody>
              {card.history.slice(-3).map((entry, i) => (
                <tr key={i} className="border-b border-[var(--border-primary)] last:border-b-0">
                  <td className="py-1 text-[var(--text-tertiary)]">
                    {formatHistoryTimestamp(entry.timestamp)}
                  </td>
                  <td className="py-1 text-[var(--text-secondary)] capitalize">
                    {entry.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
