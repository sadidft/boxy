/**
 * Boxy Tab Bar Component
 * Chrome-like tab bar with tabs, add button, and window controls
 * Responsive design for mobile
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { DynamicIcon, Plus, X, Minus, Square, Star, Menu, ChevronDown } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';

interface TabBarProps {
  boxId?: string;
  showWindowControls?: boolean;
  onMinimize?: (e: React.MouseEvent) => void;
  onMaximize?: (e: React.MouseEvent) => void;
  onClose?: (e: React.MouseEvent) => void;
}

export function TabBar({ boxId, showWindowControls = true, onMinimize, onMaximize, onClose }: TabBarProps = {}) {
  const { state, dispatch } = useApp();
  const { openModal } = useModal();
  useToast();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Use provided boxId or fall back to activeBoxId
  const targetBoxId = boxId || state.activeBoxId;
  const activeBox = state.boxes.find(b => b.id === targetBoxId);
  const tabs = state.tabs
    .filter(t => t.boxId === targetBoxId)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });

  const activeTab = tabs.find(t => t.id === state.activeTabId);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    setShowMobileMenu(false);
  }, [dispatch]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
      openModal('deleteConfirm', { type: 'tab', id: tabId, name: tab.name });
    }
  }, [openModal, state.tabs]);

  const handleAddTab = useCallback(() => {
    if (targetBoxId) {
      openModal('createTab');
    }
    setShowMobileMenu(false);
  }, [openModal, targetBoxId]);

  const handleMinimizeBox = useCallback((e: React.MouseEvent) => {
    if (onMinimize) {
      onMinimize(e);
    } else if (activeBox) {
      dispatch({ type: 'TOGGLE_MINIMIZE_BOX', payload: activeBox.id });
    }
  }, [onMinimize, activeBox, dispatch]);

  const handleMaximizeBox = useCallback((e: React.MouseEvent) => {
    if (onMaximize) {
      onMaximize(e);
    } else if (activeBox) {
      dispatch({ type: 'TOGGLE_MAXIMIZE_BOX', payload: activeBox.id });
    }
  }, [onMaximize, activeBox, dispatch]);

  const handleCloseBox = useCallback((e: React.MouseEvent) => {
    if (onClose) {
      onClose(e);
    } else if (activeBox) {
      openModal('deleteConfirm', { type: 'box', id: activeBox.id, name: activeBox.name });
    }
  }, [onClose, openModal, activeBox]);

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
    <div className="flex h-10 bg-[var(--bg-main)] border-b border-[var(--border-primary)] overflow-hidden">
      {/* Mobile: Tab dropdown trigger */}
      <div className="sm:hidden flex items-center" ref={mobileMenuRef}>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="flex items-center gap-2 px-3 h-full text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          {activeTab ? (
            <>
              <DynamicIcon name={activeTab.icon} size={16} />
              <span className="text-sm font-medium truncate max-w-[120px]">{activeTab.name}</span>
            </>
          ) : (
            <Menu size={18} />
          )}
          <ChevronDown size={14} className={cn('transition-transform', showMobileMenu && 'rotate-180')} />
        </button>
        
        {/* Mobile tab dropdown */}
        {showMobileMenu && (
          <div className="absolute top-10 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] shadow-lg max-h-[60vh] overflow-y-auto">
            {tabs.map(tab => {
              const cardCount = state.cards.filter(c => c.tabId === tab.id).length;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                    tab.id === state.activeTabId
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-l-2 border-[var(--primary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  )}
                >
                  <DynamicIcon name={tab.icon} size={18} />
                  <span className="flex-1 truncate font-medium">{tab.name}</span>
                  {tab.pinned && <Star size={14} filled className="text-[var(--primary)]" />}
                  {cardCount > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] rounded-full">
                      {cardCount}
                    </span>
                  )}
                  {!tab.pinned && (
                    <button
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      className="p-1 hover:bg-[var(--bg-main)] rounded"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleAddTab}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--primary)] hover:bg-[var(--bg-tertiary)] transition-colors border-t border-[var(--border-primary)]"
            >
              <Plus size={18} />
              <span className="font-medium">New Tab</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Horizontal tabs */}
      <div 
        ref={tabsContainerRef}
        className="hidden sm:flex flex-1 items-end overflow-x-auto scrollbar-none"
      >
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
            <DynamicIcon name={tab.icon} size={16} className="flex-shrink-0" />
            
            {!tab.pinned && (
              <span className="truncate text-sm font-medium">{tab.name}</span>
            )}
            
            {(() => {
              const cardCount = state.cards.filter(c => c.tabId === tab.id).length;
              return cardCount > 0 ? (
                <span 
                  className="flex-shrink-0 px-1.5 py-0.5 min-w-[18px] text-center text-[10px] font-medium bg-[var(--primary)] bg-opacity-20 text-[var(--primary)] rounded-full"
                  title={`${cardCount} cards`}
                >
                  {cardCount > 99 ? '99+' : cardCount}
                </span>
              ) : null;
            })()}
            
            {tab.pinned && (
              <Star size={12} filled className="text-[var(--primary)] flex-shrink-0" />
            )}
            
            {!tab.pinned && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-opacity"
                aria-label={`Close ${tab.name}`}
              >
                <X size={14} />
              </button>
            )}
            
            {tab.id === state.activeTabId && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </div>
        ))}

        <button
          onClick={handleAddTab}
          className="flex items-center justify-center w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
          aria-label="New tab"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Mobile: Add tab button (standalone) */}
      <div className="sm:hidden flex-1" />
      <button
        onClick={handleAddTab}
        className="sm:hidden flex items-center justify-center w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        aria-label="New tab"
      >
        <Plus size={18} />
      </button>

      {/* Window controls */}
      {showWindowControls && (
        <div className="flex items-center border-l border-[var(--border-primary)]">
          <button
            onClick={handleMinimizeBox}
            className="flex items-center justify-center w-8 sm:w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Minimize"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleMaximizeBox}
            className="flex items-center justify-center w-8 sm:w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Maximize"
          >
            <Square size={14} />
          </button>
          <button
            onClick={handleCloseBox}
            className="flex items-center justify-center w-8 sm:w-10 h-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-red-500/20 hover:text-red-400 transition-colors"
            aria-label="Close box"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
