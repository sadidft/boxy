/**
 * Boxy Card Create/Edit Modal
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { X, Maximize2, Minimize2 } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { parseMarkdown } from '@/utils/markdown';
import type { Card, TableData } from '@/types';

interface CardModalProps {
  mode: 'create' | 'edit';
  card?: Card;
}

export function CardModal({ mode, card }: CardModalProps) {
  const { state, dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  
  const [title, setTitle] = useState(card?.title || '');
  const [content, setContent] = useState(card?.content || '');
  const [tags, setTags] = useState<string[]>(card?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tableMode, setTableMode] = useState<'history' | 'custom'>(card?.table?.mode || 'history');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

    const table: TableData | null = tableMode === 'history' 
      ? { mode: 'history', columns: [], rows: [] }
      : null;

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
  }, [title, content, tags, tableMode, mode, card, state.activeTabId, dispatch, closeModal, success, error]);

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
            id="card-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
            autoFocus
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

        {/* Table Mode */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Table
          </label>
          <div className="flex gap-4">
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
        </div>
      </form>
    </Modal>
  );
}
