/**
 * Boxy Delete Confirmation Modal
 */

import { useCallback, useMemo } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { AlertTriangle } from '@/components/icons/Icons';

interface DeleteData {
  type: 'box' | 'tab' | 'card';
  id: string;
  name: string;
}

export function DeleteModal({ data }: { data: DeleteData }) {
  const { state, dispatch } = useApp();
  const { closeModal } = useModal();
  const { success } = useToast();

  // Calculate cascade info
  const cascadeInfo = useMemo(() => {
    if (data.type === 'box') {
      const tabs = state.tabs.filter(t => t.boxId === data.id);
      const tabIds = tabs.map(t => t.id);
      const cards = state.cards.filter(c => tabIds.includes(c.tabId));
      return { tabs: tabs.length, cards: cards.length };
    }
    if (data.type === 'tab') {
      const cards = state.cards.filter(c => c.tabId === data.id);
      return { tabs: 0, cards: cards.length };
    }
    return { tabs: 0, cards: 0 };
  }, [data, state.tabs, state.cards]);

  const handleDelete = useCallback(() => {
    switch (data.type) {
      case 'box':
        dispatch({ type: 'DELETE_BOX', payload: data.id });
        success(`Deleted box "${data.name}"`);
        break;
      case 'tab':
        dispatch({ type: 'DELETE_TAB', payload: data.id });
        success(`Deleted tab "${data.name}"`);
        break;
      case 'card':
        dispatch({ type: 'DELETE_CARD', payload: data.id });
        success(`Deleted card "${data.name}"`);
        break;
    }
    closeModal();
  }, [data, dispatch, closeModal, success]);

  const entityName = data.type.charAt(0).toUpperCase() + data.type.slice(1);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title={`Delete ${entityName}?`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-red-500/10 rounded-full mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        
        <p className="text-[var(--text-primary)] mb-2">
          Are you sure you want to delete "{data.name}"?
        </p>
        
        {(cascadeInfo.tabs > 0 || cascadeInfo.cards > 0) && (
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            This will also delete{' '}
            {cascadeInfo.tabs > 0 && `${cascadeInfo.tabs} tab${cascadeInfo.tabs > 1 ? 's' : ''}`}
            {cascadeInfo.tabs > 0 && cascadeInfo.cards > 0 && ' and '}
            {cascadeInfo.cards > 0 && `${cascadeInfo.cards} card${cascadeInfo.cards > 1 ? 's' : ''}`}
            {' '}inside.
          </p>
        )}
        
        <p className="text-[var(--text-tertiary)] text-xs">
          This action can be undone within 7 actions.
        </p>
      </div>
    </Modal>
  );
}
