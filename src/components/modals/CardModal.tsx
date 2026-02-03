/**
 * Boxy Card Create/Edit Modal
 * Uses TagInput and TableEditor components
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { Icon } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { parseMarkdown } from '@/utils/markdown';
import { generateId } from '@/utils/helpers';
import { TagInput } from '@/components/common/TagInput';
import { TableEditor } from '@/components/common/TableEditor';
import type { Card, TableData } from '@/types';

interface CardModalProps {
  mode: 'create' | 'edit';
  card?: Card;
}

export function CardModal({ mode, card }: CardModalProps) {
  const { state, dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(card?.title || '');
  const [content, setContent] = useState(card?.content || '');
  const [tags, setTags] = useState<string[]>(card?.tags || []);
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="card-title" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Title <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            ref={titleInputRef}
            id="card-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter card title..."
            className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="card-content" className="text-sm font-medium text-[var(--text-secondary)]">
              Content <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  showPreview 
                    ? "bg-[var(--primary)] text-white" 
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                )}
              >
                {showPreview ? '✓ Preview' : 'Preview'}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Icon.Minimize2 size={16} /> : <Icon.Maximize2 size={16} />}
              </button>
            </div>
          </div>
          
          {showPreview ? (
            <div 
              className={cn(
                "w-full overflow-y-auto p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg",
                "prose prose-sm prose-invert max-w-none",
                isExpanded ? 'min-h-[400px] max-h-[60vh]' : 'min-h-[200px] max-h-[400px]'
              )}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              id="card-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content here...&#10;&#10;Markdown supported:&#10;**bold**, *italic*, `code`&#10;&#10;Variables: {{name}}, {{date}}, {{time}}"
              className={cn(
                'w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg',
                'text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm leading-relaxed',
                'outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]',
                'resize-none transition-all',
                isExpanded ? 'min-h-[400px]' : 'min-h-[200px]'
              )}
            />
          )}
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            Supports <span className="text-[var(--primary)]">Markdown</span>. 
            Use <code className="px-1 bg-[var(--bg-tertiary)] rounded">{'{{variable}}'}</code> for custom prompts, 
            <code className="px-1 bg-[var(--bg-tertiary)] rounded">{'{{date}}'}</code>, 
            <code className="px-1 bg-[var(--bg-tertiary)] rounded">{'{{time}}'}</code> for auto-fill.
          </p>
        </div>

        {/* Tags - Using TagInput Component */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Tags
          </label>
          <TagInput
            tags={tags}
            onChange={setTags}
            placeholder="Add tags (e.g., work, template, email)"
            maxTags={10}
          />
        </div>

        {/* Table Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Table
          </label>
          
          {/* Mode Selector */}
          <div className="flex flex-wrap gap-3 mb-4">
            <label 
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all border",
                tableMode === 'history' 
                  ? "bg-[var(--primary)] bg-opacity-10 border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-primary)]"
              )}
            >
              <input
                type="radio"
                name="tableMode"
                value="history"
                checked={tableMode === 'history'}
                onChange={() => setTableMode('history')}
                className="sr-only"
              />
              <Icon.Clock size={18} />
              <div>
                <span className="font-medium">History</span>
                <p className="text-xs opacity-70">Auto-record actions</p>
              </div>
            </label>
            
            <label 
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all border",
                tableMode === 'custom' 
                  ? "bg-[var(--primary)] bg-opacity-10 border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-primary)]"
              )}
            >
              <input
                type="radio"
                name="tableMode"
                value="custom"
                checked={tableMode === 'custom'}
                onChange={() => setTableMode('custom')}
                className="sr-only"
              />
              <Icon.Table size={18} />
              <div>
                <span className="font-medium">Custom</span>
                <p className="text-xs opacity-70">Build your own table</p>
              </div>
            </label>
          </div>

          {/* Custom Table Editor */}
          {tableMode === 'custom' && (
            <TableEditor
              table={customTable}
              onChange={setCustomTable}
              maxColumns={state.settings.limits.maxColumnsPerTable}
              maxRows={50}
            />
          )}

          {/* History Mode Info */}
          {tableMode === 'history' && (
            <div className="flex items-start gap-3 p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <Icon.Info size={18} className="text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[var(--text-secondary)]">
                <p className="font-medium text-[var(--text-primary)] mb-1">Automatic History Tracking</p>
                <p>Records when the card is created, edited, or copied. The table will display the last 4 actions with timestamps.</p>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
