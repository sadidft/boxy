/**
 * Boxy Box Create/Edit Modal
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { DynamicIcon } from '@/components/icons/Icons';
import { IconPickerModal } from '@/components/common/IconPicker';
import type { Box } from '@/types';

interface BoxModalProps {
  mode: 'create' | 'edit';
  box?: Box;
}

export function BoxModal({ mode, box }: BoxModalProps) {
  const { dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(box?.name || '');
  const [icon, setIcon] = useState(box?.icon || 'boxy');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Autofocus on name input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
    <>
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
                onClick={() => setShowIconPicker(true)}
                className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
              >
                Change Icon
              </button>
              <span className="text-sm text-[var(--text-tertiary)]">{icon}</span>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label htmlFor="box-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Name
            </label>
            <input
              ref={inputRef}
              id="box-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, Personal"
              className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
            />
          </div>
        </form>
      </Modal>
      
      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={showIconPicker}
        selectedIcon={icon}
        onSelect={(iconName) => {
          setIcon(iconName);
          setShowIconPicker(false);
        }}
        onClose={() => setShowIconPicker(false)}
      />
    </>
  );
}
