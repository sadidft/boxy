/**
 * Boxy Modal Controller
 * Renders the appropriate modal based on current modal state
 */

import { useModal } from '@/store/AppContext';
import { BoxModal } from './BoxModal';
import { TabModal } from './TabModal';
import { CardModal } from './CardModal';
import { DeleteModal } from './DeleteModal';
import { VariableModal } from './VariableModal';
import { SettingsModal } from './SettingsModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import type { Box, Tab, Card } from '@/types';

export function ModalController() {
  const { modal } = useModal();

  switch (modal.type) {
    case 'createBox':
      return <BoxModal mode="create" />;
    
    case 'editBox':
      return <BoxModal mode="edit" box={modal.data as Box} />;
    
    case 'createTab':
      return <TabModal mode="create" />;
    
    case 'editTab':
      return <TabModal mode="edit" tab={modal.data as Tab} />;
    
    case 'createCard':
      return <CardModal mode="create" />;
    
    case 'editCard':
      return <CardModal mode="edit" card={modal.data as Card} />;
    
    case 'deleteConfirm':
      return <DeleteModal data={modal.data as { type: 'box' | 'tab' | 'card'; id: string; name: string }} />;
    
    case 'variableInput':
      return <VariableModal data={modal.data as { card: Card; customVars: string[] }} />;
    
    case 'settings':
      return <SettingsModal />;
    
    case 'keyboardShortcuts':
      return <KeyboardShortcutsModal />;
    
    case 'export':
      return <ExportModal />;
    
    case 'import':
      return <ImportModal />;
    
    default:
      return null;
  }
}
