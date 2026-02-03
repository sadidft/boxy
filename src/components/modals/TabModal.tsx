/**
 * Boxy Tab Create/Edit Modal
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { DynamicIcon } from '@/components/icons/Icons';
import { IconPickerModal } from '@/components/common/IconPicker';
import type { Tab } from '@/types';

interface TabModalProps {
  mode: 'create' | 'edit';
  tab?: Tab;
}

export function TabModal({ mode, tab }: TabModalProps) {
  const { state, dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(tab?.name || '');
  const [icon, setIcon] = useState(tab?.icon || 'boxy');
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
      error('Tab name is required');
      return;
    }

    if (!state.activeBoxId) {
      error('No active box');
      return;
    }

    if (mode === 'create') {
      dispatch({ 
        type: 'CREATE_TAB', 
        payload: { 
          boxId: state.activeBoxId, 
          name: name.trim(), 
          icon,
          pinned: false 
        } 
      });
      success('Tab created');
    } else if (tab) {
      dispatch({ 
        type: 'UPDATE_TAB', 
        payload: { id: tab.id, updates: { name: name.trim(), icon } } 
      });
      success('Tab updated');
    }
    
    closeModal();
  }, [name, icon, mode, tab, state.activeBoxId, dispatch, closeModal, success, error]);

  const handleDelete = useCallback(() => {
    if (tab) {
      openModal('deleteConfirm', { type: 'tab', id: tab.id, name: tab.name });
    }
  }, [tab, openModal]);

  return (
    <>
      <Modal
        isOpen={true}
        onClose={closeModal}
        title={mode === 'create' ? 'Create Tab' : 'Edit Tab'}
        footer={
          <>
            {mode === 'edit' && (
              <Button variant="danger" onClick={handleDelete} className="mr-auto">
                Delete Tab
              </Button>
            )}
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {mode === 'create' ? 'Create Tab' : 'Save Changes'}
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
            <label htmlFor="tab-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Name
            </label>
            <input
              ref={inputRef}
              id="tab-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Email Templates"
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
