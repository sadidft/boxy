/**
 * Boxy Address Bar Component
 * Navigation, search, and actions - Responsive design
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApp, useModal } from '@/store/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Star, 
  Circle, 
  MoreVertical,
  X,
  DynamicIcon,
  Settings,
  Plus,
  Download,
  Upload,
  Keyboard,
  Edit
} from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { debounce } from '@/utils/helpers';
import { DEBOUNCE } from '@/config/constants';

export function AddressBar() {
  const { state, dispatch } = useApp();
  const { openModal } = useModal();
  const [showBoxDropdown, setShowBoxDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const boxDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const activeBox = state.boxes.find(b => b.id === state.activeBoxId);
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  
  const canUndo = state.actionHistory.length > 0;
  const canRedo = state.actionFuture.length > 0;

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    }, DEBOUNCE.search),
    [dispatch]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const handleSearchFocus = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_MODE', payload: true });
  }, [dispatch]);

  const handleClearSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_MODE', payload: false });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_SEARCH_TAGS', payload: [] });
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, [dispatch]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      dispatch({ type: 'UNDO' });
    }
  }, [dispatch, canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      dispatch({ type: 'REDO' });
    }
  }, [dispatch, canRedo]);

  const handlePinTab = useCallback(() => {
    if (activeTab) {
      dispatch({ 
        type: 'UPDATE_TAB', 
        payload: { id: activeTab.id, updates: { pinned: !activeTab.pinned } } 
      });
    }
  }, [dispatch, activeTab]);

  const handleBoxSelect = useCallback((boxId: string) => {
    dispatch({ type: 'SET_ACTIVE_BOX', payload: boxId });
    setShowBoxDropdown(false);
  }, [dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxDropdownRef.current && !boxDropdownRef.current.contains(e.target as Node)) {
        setShowBoxDropdown(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setShowMoreDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        dispatch({ type: 'SET_SEARCH_MODE', payload: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <div className="flex items-center h-12 px-2 gap-1 sm:gap-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] overflow-x-hidden">
      {/* Navigation buttons - hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-1">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canUndo 
              ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              : 'text-[var(--text-tertiary)] cursor-not-allowed'
          )}
          aria-label="Undo"
          title={canUndo ? `Undo: ${state.actionHistory[state.actionHistory.length - 1]?.description}` : 'Nothing to undo'}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canRedo 
              ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              : 'text-[var(--text-tertiary)] cursor-not-allowed'
          )}
          aria-label="Redo"
          title={canRedo ? `Redo: ${state.actionFuture[state.actionFuture.length - 1]?.description}` : 'Nothing to redo'}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Path / Search area - takes remaining space */}
      <div className="flex-1 min-w-0 relative">
        <div 
          className={cn(
            'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg',
            'bg-[var(--bg-main)] border border-[var(--border-primary)]',
            'focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/20'
          )}
        >
          <Search size={16} className="text-[var(--text-tertiary)] flex-shrink-0" />
          
          {/* Search tags - horizontal scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-shrink-0 max-w-[30%] sm:max-w-none">
            {state.searchTags.map(tag => (
              <span 
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-xs rounded-full whitespace-nowrap"
              >
                #{tag}
                <button 
                  onClick={() => dispatch({ type: 'SET_SEARCH_TAGS', payload: state.searchTags.filter(t => t !== tag) })}
                  className="hover:text-[var(--primary-hover)]"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            placeholder={state.isSearchMode ? 'Search cards...' : activeBox && activeTab ? `${activeBox.name} › ${activeTab.name}` : 'Search...'}
            className="flex-1 min-w-0 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none truncate"
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
          />
          
          {(state.isSearchMode || state.searchQuery) && (
            <button
              onClick={handleClearSearch}
              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons - compact on mobile */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* Pin Tab - hidden on mobile */}
        {activeTab && (
          <button
            onClick={handlePinTab}
            className={cn(
              'hidden sm:flex p-2 rounded-lg transition-colors',
              activeTab.pinned 
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            )}
            aria-label={activeTab.pinned ? 'Unpin tab' : 'Pin tab'}
            title={activeTab.pinned ? 'Unpin tab' : 'Pin tab'}
          >
            <Star size={18} filled={activeTab.pinned} />
          </button>
        )}

        {/* Box Switcher - Shows active box icon */}
        <div className="relative" ref={boxDropdownRef}>
          <button
            onClick={() => setShowBoxDropdown(!showBoxDropdown)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showBoxDropdown
                ? 'text-[var(--primary)] bg-[var(--bg-tertiary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            )}
            aria-label="Switch box"
            aria-haspopup="true"
            aria-expanded={showBoxDropdown}
            title={activeBox ? `Current: ${activeBox.name}` : 'Switch box'}
          >
            {activeBox ? (
              <DynamicIcon name={activeBox.icon} size={18} />
            ) : (
              <Circle size={18} filled={showBoxDropdown} />
            )}
          </button>
          
          {showBoxDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 max-w-[calc(100vw-1rem)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50 py-1">
              {state.boxes.map(box => (
                <button
                  key={box.id}
                  onClick={() => handleBoxSelect(box.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
                    box.id === state.activeBoxId
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  )}
                >
                  <DynamicIcon name={box.icon} size={18} />
                  <span className="flex-1 truncate">{box.name}</span>
                  {box.id === state.activeBoxId && <Circle size={8} filled />}
                </button>
              ))}
              
              <div className="h-px bg-[var(--border-primary)] my-1" />
              
              <button
                onClick={() => { setShowBoxDropdown(false); openModal('createBox'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Plus size={18} />
                <span>New Box</span>
              </button>
              
              <div className="h-px bg-[var(--border-primary)] my-1" />
              
              <button
                onClick={() => { setShowBoxDropdown(false); openModal('settings'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* More Menu */}
        <div className="relative" ref={moreDropdownRef}>
          <button
            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            )}
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={showMoreDropdown}
          >
            <MoreVertical size={18} />
          </button>
          
          {showMoreDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 max-w-[calc(100vw-1rem)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50 py-1">
              {/* Mobile-only: Undo/Redo */}
              <div className="sm:hidden">
                <button
                  onClick={() => { handleUndo(); setShowMoreDropdown(false); }}
                  disabled={!canUndo}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                    canUndo 
                      ? 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                      : 'text-[var(--text-tertiary)] cursor-not-allowed'
                  )}
                >
                  <ChevronLeft size={16} />
                  <span>Undo</span>
                </button>
                <button
                  onClick={() => { handleRedo(); setShowMoreDropdown(false); }}
                  disabled={!canRedo}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                    canRedo 
                      ? 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                      : 'text-[var(--text-tertiary)] cursor-not-allowed'
                  )}
                >
                  <ChevronRight size={16} />
                  <span>Redo</span>
                </button>
                <div className="h-px bg-[var(--border-primary)] my-1" />
              </div>
              
              {/* Mobile-only: Pin Tab */}
              {activeTab && (
                <div className="sm:hidden">
                  <button
                    onClick={() => { handlePinTab(); setShowMoreDropdown(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <Star size={16} filled={activeTab.pinned} />
                    <span>{activeTab.pinned ? 'Unpin Tab' : 'Pin Tab'}</span>
                  </button>
                  <div className="h-px bg-[var(--border-primary)] my-1" />
                </div>
              )}
            
              {activeBox && (
                <button
                  onClick={() => { setShowMoreDropdown(false); openModal('editBox', activeBox); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit Box</span>
                </button>
              )}
              
              {activeTab && (
                <button
                  onClick={() => { setShowMoreDropdown(false); openModal('editTab', activeTab); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit Tab</span>
                </button>
              )}
              
              <div className="h-px bg-[var(--border-primary)] my-1" />
              
              <button
                onClick={() => { setShowMoreDropdown(false); openModal('settings'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              
              <div className="h-px bg-[var(--border-primary)] my-1" />
              
              <button
                onClick={() => { setShowMoreDropdown(false); openModal('export'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => { setShowMoreDropdown(false); openModal('import'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Upload size={16} />
                <span>Import</span>
              </button>
              
              <div className="h-px bg-[var(--border-primary)] my-1" />
              
              <button
                onClick={() => { setShowMoreDropdown(false); openModal('keyboardShortcuts'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Keyboard size={16} />
                <span>Keyboard Shortcuts</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
