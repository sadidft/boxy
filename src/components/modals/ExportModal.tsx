/**
 * Boxy Export Modal
 */

import { useState, useCallback } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { exportAllData, exportBox } from '@/store/storage';
import { Download } from '@/components/icons/Icons';

export function ExportModal() {
  const { state } = useApp();
  const { closeModal } = useModal();
  const { success, error } = useToast();
  
  const [exportType, setExportType] = useState<'all' | 'box'>('all');

  const activeBox = state.boxes.find(b => b.id === state.activeBoxId);
  const date = new Date().toISOString().split('T')[0];
  
  const filename = exportType === 'all' 
    ? `boxy_export_${date}.json`
    : `boxy_box_${activeBox?.name.toLowerCase().replace(/\s+/g, '_') || 'export'}_${date}.json`;

  const handleExport = useCallback(() => {
    try {
      let data: string;
      
      if (exportType === 'all') {
        data = exportAllData(state);
      } else if (state.activeBoxId) {
        data = exportBox(state, state.activeBoxId);
      } else {
        error('No box selected');
        return;
      }
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      success('Data exported successfully');
      closeModal();
    } catch (err) {
      error('Export failed');
    }
  }, [exportType, state, filename, closeModal, success, error]);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Export Data"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg cursor-pointer hover:border-[var(--primary)] transition-colors">
            <input
              type="radio"
              name="exportType"
              value="all"
              checked={exportType === 'all'}
              onChange={() => setExportType('all')}
              className="text-[var(--primary)]"
            />
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">All Data</div>
              <div className="text-xs text-[var(--text-secondary)]">
                Export everything ({state.boxes.length} boxes, {state.tabs.length} tabs, {state.cards.length} cards)
              </div>
            </div>
          </label>
          
          {activeBox && (
            <label className="flex items-center gap-3 p-3 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg cursor-pointer hover:border-[var(--primary)] transition-colors">
              <input
                type="radio"
                name="exportType"
                value="box"
                checked={exportType === 'box'}
                onChange={() => setExportType('box')}
                className="text-[var(--primary)]"
              />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Current Box Only</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Export "{activeBox.name}" with its tabs and cards
                </div>
              </div>
            </label>
          )}
        </div>

        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-xs text-[var(--text-secondary)]">Filename</div>
          <div className="text-sm text-[var(--text-primary)] font-mono mt-1">{filename}</div>
        </div>
      </div>
    </Modal>
  );
}
