/**
 * Boxy Variable Input Modal
 * Prompts user for custom variable values when copying
 */

import { useState, useCallback, useMemo } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { processContentForCopy, replaceVariables } from '@/utils/variables';
import type { Card } from '@/types';

interface VariableData {
  card: Card;
  customVars: string[];
}

export function VariableModal({ data }: { data: VariableData }) {
  const { dispatch } = useApp();
  const { closeModal } = useModal();
  const { success, error } = useToast();
  
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(data.customVars.map(v => [v, '']))
  );

  // Live preview
  const preview = useMemo(() => {
    return replaceVariables(data.card.content, values);
  }, [data.card.content, values]);

  const handleChange = useCallback((varName: string, value: string) => {
    setValues(prev => ({ ...prev, [varName]: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    // Validate all fields have values
    const emptyFields = data.customVars.filter(v => !values[v]?.trim());
    if (emptyFields.length > 0) {
      error(`Please fill in: ${emptyFields.join(', ')}`);
      return;
    }

    try {
      const processed = await processContentForCopy(data.card.content, values);
      await navigator.clipboard.writeText(processed);
      
      // Update stats
      dispatch({ type: 'INCREMENT_COPY_COUNT', payload: data.card.id });
      
      success('Copied to clipboard');
      closeModal();
    } catch (err) {
      error('Failed to copy');
    }
  }, [data, values, dispatch, closeModal, success, error]);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Fill in Variables"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleCopy}>
            Copy to Clipboard
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Variable inputs */}
        {data.customVars.map(varName => (
          <div key={varName}>
            <label 
              htmlFor={`var-${varName}`}
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              {varName}
            </label>
            <input
              id={`var-${varName}`}
              type="text"
              value={values[varName] || ''}
              onChange={(e) => handleChange(varName, e.target.value)}
              placeholder={`Enter ${varName}...`}
              className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
            />
          </div>
        ))}

        {/* Preview */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            Preview
          </h4>
          <div className="p-3 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg max-h-48 overflow-y-auto">
            <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono">
              {preview}
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  );
}
