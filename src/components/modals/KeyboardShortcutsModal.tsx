/**
 * Boxy Keyboard Shortcuts Modal
 */

import { Modal, Button } from './Modal';
import { useModal } from '@/store/AppContext';
import { getModifierKey } from '@/utils/helpers';

export function KeyboardShortcutsModal() {
  const { closeModal } = useModal();
  const mod = getModifierKey();

  const shortcuts = [
    {
      category: 'Global',
      items: [
        { keys: `${mod} + K`, action: 'Focus search' },
        { keys: `${mod} + N`, action: 'New card' },
        { keys: `${mod} + T`, action: 'New tab' },
        { keys: `${mod} + B`, action: 'New box' },
        { keys: `${mod} + Z`, action: 'Undo' },
        { keys: `${mod} + Shift + Z`, action: 'Redo' },
        { keys: `${mod} + ,`, action: 'Settings' },
        { keys: 'Escape', action: 'Close modal / Clear search' },
        { keys: '?', action: 'Show shortcuts' },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { keys: `${mod} + 1-9`, action: 'Switch to tab 1-9' },
        { keys: `${mod} + Tab`, action: 'Next tab' },
        { keys: `${mod} + Shift + Tab`, action: 'Previous tab' },
        { keys: '↑ ↓ ← →', action: 'Navigate cards' },
        { keys: 'Tab', action: 'Cycle through cards' },
        { keys: 'Enter', action: 'Copy selected card' },
      ],
    },
    {
      category: 'Card Actions',
      items: [
        { keys: 'C', action: 'Copy card' },
        { keys: 'E', action: 'Edit card' },
        { keys: 'P', action: 'Pin/unpin card' },
        { keys: 'Delete', action: 'Delete card' },
      ],
    },
    {
      category: 'Modal',
      items: [
        { keys: 'Escape', action: 'Close modal' },
        { keys: 'Enter', action: 'Submit form' },
        { keys: `${mod} + Enter`, action: 'Submit from textarea' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Keyboard Shortcuts"
      size="md"
      footer={
        <Button onClick={closeModal}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {shortcuts.map(group => (
          <div key={group.category}>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              {group.category}
            </h4>
            <div className="space-y-1">
              {group.items.map(shortcut => (
                <div 
                  key={shortcut.keys}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-[var(--text-secondary)]">
                    {shortcut.action}
                  </span>
                  <kbd className="px-2 py-1 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded text-xs font-mono text-[var(--text-primary)]">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
