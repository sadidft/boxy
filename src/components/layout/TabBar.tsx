/**
 * Boxy Tab Bar Component
 * Chrome-like tab bar with tabs, add button, and window controls
 */

import React, { useCallback, useState } from 'react';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { DynamicIcon, Plus, X, Minus, Square, Star } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';

export function TabBar() {
  const { state, dispatch } = useApp();
  const { openModal } = useModal();
  const { success } = useToast();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const activeBox = state.boxes.find(b => b.id === state.activeBoxId);
  const tabs = state.tabs
    .filter(t => t.boxId === state.activeBoxId)
    .sort((a, b) => {
      // Pinned tabs first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });

  const handleTabClick = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  }, [dispatch]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
      openModal('deleteConfirm', { type: 'tab', id: tabId, name: tab.name });
    }
  }, [openModal, state.tabs]);

  const handleAddTab = useCallback(() => {
    if (state.activeBoxId) {
      openModal('createTab');
    }
  }, [openModal, state.activeBoxId]);

  const handleMinimizeBox = useCallback(() => {
    // Minimize functionality - for now just show toast
    success('Box minimized');
  }, [success]);

  const handleMaximizeBox = useCallback(() => {
    // Maximize functionality
    success('Box maximized');
  }, [success]);

  const handleCloseBox = useCallback(() => {
    if (activeBox) {
      openModal('deleteConfirm', { type: 'box', id: activeBox.id, name: activeBox.name });
    }
  }, [openModal, activeBox]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.pinned) return;
    
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  }, [tabs]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId) return;

    const targetTab = tabs.find(t => t.id === targetTabId);
    if (!targetTab) return;

    dispatch({ type: 'REORDER_TABS', payload: { tabId: draggedTabId, newOrder: targetTab.order } });
    setDraggedTabId(null);
  }, [draggedTabId, tabs, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null);
  }, []);

  if (!activeBox) return null;

  return (
    <div className="flex h-10 bg-[var(--bg-main)] border-b border-[var(--border-primary)]">
      {/* Tabs container */}
      <div className="flex-1 flex items-end overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === state.activeTabId}
            tabIndex={0}
            className={cn(
              'group relative flex items-center gap-2 px-3 py-2 min-w-[40px] max-w-[200px] cursor-pointer transition-colors',
              'border-r border-[var(--border-primary)]',
              tab.id === state.activeTabId
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
              draggedTabId === tab.id && 'opacity-50'
            )}
            onClick={() => handleTabClick(tab.id)}
            draggable={!tab.pinned && state.settings.features.tabDragReorder}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Tab icon */}
            <DynamicIcon name={tab.icon} size={16} className="flex-shrink-0" />
            
            {/* Tab name */}
            {!tab.pinned && (
              <span className="truncate text-sm font-medium">{tab.name}</span>
            )}
            
            {/* Pinned indicator */}
            {tab.pinned && (
              <Star size={12} filled className="text-[var(--primary)] flex-shrink-0" />
            )}
            
            {/* Close button (not for pinned) */}
            {!tab.pinned && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-opacity"
                aria-label={`Close ${tab.name}`}
              >
                <X size={14} />
              </button>
            )}
            
            {/* Active indicator */}
            {tab.id === state.activeTabId && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </div>
        ))}

        {/* Add tab button */}
        <button
          onClick={handleAddTab}
          className="flex items-center justify-center w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="New tab"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Window controls */}
      <div className="flex items-center border-l border-[var(--border-primary)]">
        <button
          onClick={handleMinimizeBox}
          className="flex items-center justify-center w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximizeBox}
          className="flex items-center justify-center w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Maximize"
        >
          <Square size={14} />
        </button>
        <button
          onClick={handleCloseBox}
          className="flex items-center justify-center w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-red-500/20 hover:text-red-400 transition-colors"
          aria-label="Close box"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
