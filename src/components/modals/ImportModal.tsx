/**
 * Boxy Import Modal
 */

import React, { useState, useCallback, useRef } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { validateImportData } from '@/store/storage';
import { Upload, AlertCircle, Check } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';

export function ImportModal() {
  const { dispatch } = useApp();
  const { closeModal } = useModal();
  const { success, error } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    data?: unknown;
    type?: 'full' | 'box';
    summary?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const result = validateImportData(text);
      
      if (result.valid && result.data) {
        const data = result.data as { boxes?: unknown[]; tabs?: unknown[]; cards?: unknown[]; box?: unknown };
        let summary = '';
        
        if (result.type === 'full') {
          const boxes = (data.boxes as unknown[])?.length || 0;
          const tabs = (data.tabs as unknown[])?.length || 0;
          const cards = (data.cards as unknown[])?.length || 0;
          summary = `${boxes} boxes, ${tabs} tabs, ${cards} cards`;
        } else {
          const tabs = (data.tabs as unknown[])?.length || 0;
          const cards = (data.cards as unknown[])?.length || 0;
          summary = `1 box, ${tabs} tabs, ${cards} cards`;
        }
        
        setValidationResult({ ...result, summary });
      } else {
        setValidationResult(result);
      }
    } catch (err) {
      setValidationResult({ valid: false, error: 'Failed to read file' });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/json' || droppedFile?.name.endsWith('.json')) {
      handleFileSelect(droppedFile);
    } else {
      setValidationResult({ valid: false, error: 'Please select a JSON file' });
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(() => {
    if (!validationResult?.valid || !validationResult.data) {
      error('Invalid file');
      return;
    }

    try {
      const data = validationResult.data as {
        settings?: unknown;
        boxes?: unknown[];
        tabs?: unknown[];
        cards?: unknown[];
        allTags?: string[];
        box?: unknown;
      };

      if (validationResult.type === 'full') {
        dispatch({
          type: 'IMPORT_FULL',
          payload: {
            settings: data.settings as never,
            boxes: data.boxes as never[],
            tabs: data.tabs as never[],
            cards: data.cards as never[],
            allTags: data.allTags || [],
          },
        });
        success('Data imported successfully');
      } else {
        dispatch({
          type: 'IMPORT_BOX',
          payload: {
            box: data.box as never,
            tabs: data.tabs as never[],
            cards: data.cards as never[],
          },
        });
        success('Box imported successfully');
      }
      
      closeModal();
    } catch (err) {
      error('Import failed');
    }
  }, [validationResult, dispatch, closeModal, success, error]);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Import Data"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!validationResult?.valid}
          >
            Import
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragging
              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
              : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          )}
        >
          <Upload size={32} className="text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm text-[var(--text-primary)] text-center">
            {file ? file.name : 'Drop a JSON file here or click to select'}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Boxy export files only
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Validation result */}
        {validationResult && (
          <div className={cn(
            'flex items-start gap-3 p-3 rounded-lg',
            validationResult.valid
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          )}>
            {validationResult.valid ? (
              <Check size={20} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            )}
            <div>
              {validationResult.valid ? (
                <>
                  <p className="text-sm font-medium">Valid Boxy export</p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {validationResult.type === 'full' ? 'Full backup' : 'Single box'}: {validationResult.summary}
                  </p>
                </>
              ) : (
                <p className="text-sm">{validationResult.error}</p>
              )}
            </div>
          </div>
        )}

        {/* Warning */}
        {validationResult?.type === 'full' && (
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <p className="text-sm text-yellow-400">
              ⚠️ Importing will replace all existing data. Make sure to export your current data first if needed.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
