/**
 * Boxy Box Create/Edit Modal
 */

import React, { useState, useCallback } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { DynamicIcon, AVAILABLE_ICONS } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import type { Box } from '@/types';

interface BoxModalProps {
  mode: 'create' | 'edit';
  box?: Box;
}

export function BoxModal({ mode, box }: BoxModalProps) {
  const { dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  
  const [name, setName] = useState(box?.name || '');
  const [icon, setIcon] = useState(box?.icon || 'box');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = AVAILABLE_ICONS.filter(i => 
    i.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      error('Box name is required');
      return;
    }

    if (mode === 'create') {
      dispatch({ type: 'CREATE_BOX', payload: { name: name.trim(), icon, isMinimized: false, isMaximized: false } });
      success('Box created');
    } else if (box) {
      dispatch({ type: 'UPDATE_BOX', payload: { id: box.id, updates: { name: name.trim(), icon } } });
      success('Box updated');
    }
    
    closeModal();
  }, [name, icon, mode, box, dispatch, closeModal, success, error]);

  const handleDelete = useCallback(() => {
    if (box) {
      openModal('deleteConfirm', { type: 'box', id: box.id, name: box.name });
    }
  }, [box, openModal]);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title={mode === 'create' ? 'Create Box' : 'Edit Box'}
      footer={
        <>
          {mode === 'edit' && (
            <Button variant="danger" onClick={handleDelete} className="mr-auto">
              Delete Box
            </Button>
          )}
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'create' ? 'Create Box' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icon selector */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Icon
          </label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg">
              <DynamicIcon name={icon} size={24} className="text-[var(--text-primary)]" />
            </div>
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
            >
              Change Icon
            </button>
          </div>
          
          {showIconPicker && (
            <div className="mt-3 p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-primary)]">
              <input
                type="text"
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full px-3 py-2 mb-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)]"
              />
              <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                {filteredIcons.map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => { setIcon(iconName); setShowIconPicker(false); }}
                    className={cn(
                      'p-2 rounded hover:bg-[var(--bg-tertiary)] transition-colors',
                      icon === iconName && 'bg-[var(--primary)]/20 text-[var(--primary)]'
                    )}
                    title={iconName}
                  >
                    <DynamicIcon name={iconName} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Name input */}
        <div>
          <label htmlFor="box-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Name
          </label>
          <input
            id="box-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Work, Personal"
            className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}
