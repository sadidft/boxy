/**
 * Boxy Settings Modal
 */

import { useState, useCallback } from 'react';
import { Modal, Button } from './Modal';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { Download, Upload, Trash, Keyboard } from '@/components/icons/Icons';
import { Logo } from '@/components/icons/Logo';
import { cn } from '@/utils/cn';
import { exportAllData, clearAllData } from '@/store/storage';
import { APP_CONFIG } from '@/config/constants';
import type { Settings } from '@/types';

export function SettingsModal() {
  const { state, dispatch } = useApp();
  const { closeModal, openModal } = useModal();
  const { success, error } = useToast();
  
  const [settings, setSettings] = useState<Settings>(state.settings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSettingChange = useCallback(<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFeatureChange = useCallback((key: keyof Settings['features'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value }
    }));
  }, []);

  const handleLimitChange = useCallback((key: keyof Settings['limits'], value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      limits: { ...prev.limits, [key]: value }
    }));
  }, []);

  const handleSave = useCallback(() => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
    
    success('Settings saved');
    closeModal();
  }, [settings, dispatch, closeModal, success]);

  const handleExport = useCallback(() => {
    try {
      const data = exportAllData(state);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `boxy_export_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Data exported');
    } catch (err) {
      error('Export failed');
    }
  }, [state, success, error]);

  const handleClearAll = useCallback(() => {
    clearAllData();
    window.location.reload();
  }, []);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Settings"
      size="lg"
      footer={
        <Button onClick={handleSave}>
          Save & Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Appearance */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Appearance</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Theme</label>
              <div className="flex gap-2">
                {(['system', 'dark', 'light'] as const).map(theme => (
                  <button
                    key={theme}
                    onClick={() => handleSettingChange('theme', theme)}
                    className={cn(
                      'px-4 py-2 text-sm rounded-lg capitalize transition-colors',
                      settings.theme === theme
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)]'
                    )}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                  className="w-24 px-2 py-1 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Features</h3>
          
          <div className="space-y-2">
            {[
              { key: 'tableInCards' as const, label: 'Show tables in cards' },
              { key: 'autoRecordHistory' as const, label: 'Auto-record history' },
              { key: 'cardDragDrop' as const, label: 'Card drag and drop' },
              { key: 'tabDragReorder' as const, label: 'Tab drag and reorder' },
              { key: 'masonryLayout' as const, label: 'Masonry grid layout' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.features[key]}
                  onChange={(e) => handleFeatureChange(key, e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Limits */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Limits</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'maxBoxes' as const, label: 'Max boxes', options: [5, 10, 20, 50] },
              { key: 'maxTabsPerBox' as const, label: 'Max tabs per box', options: [6, 12, 24, 50] },
              { key: 'maxCardsPerTab' as const, label: 'Max cards per tab', options: [25, 50, 100, 200] },
            ].map(({ key, label, options }) => (
              <div key={key}>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">{label}</label>
                <select
                  value={settings.limits[key]}
                  onChange={(e) => handleLimitChange(key, parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)]"
                >
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.limits.bypassLimits}
              onChange={(e) => handleLimitChange('bypassLimits', e.target.checked)}
              className="w-4 h-4 rounded text-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-primary)]">
              Bypass all limits
              <span className="text-[var(--text-tertiary)] ml-1">(may cause performance issues)</span>
            </span>
          </label>
        </section>

        {/* Data */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Data</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg transition-colors"
            >
              <Download size={16} />
              Export All Data
            </button>
            
            <button
              onClick={() => openModal('import')}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg transition-colors"
            >
              <Upload size={16} />
              Import Data
            </button>
            
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors"
              >
                <Trash size={16} />
                Clear All Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Are you sure?</span>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                >
                  Yes, clear all
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Help */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Help</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openModal('keyboardShortcuts')}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg transition-colors"
            >
              <Keyboard size={16} />
              Keyboard Shortcuts
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Boxes', value: state.boxes.length, icon: '📦' },
              { label: 'Tabs', value: state.tabs.length, icon: '📁' },
              { label: 'Cards', value: state.cards.length, icon: '📋' },
              { label: 'Tags', value: state.allTags.length, icon: '🏷️' },
            ].map(stat => (
              <div key={stat.label} className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-[var(--text-tertiary)]">
            Total copies: {state.cards.reduce((sum, c) => sum + c.copyCount, 0)}
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">About</h3>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Logo size={48} />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {APP_CONFIG.name}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Version {APP_CONFIG.version}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {APP_CONFIG.tagline}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                100% offline • No tracking • Your data stays with you
              </p>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
