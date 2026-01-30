/**
 * Boxy Keyboard Shortcuts Hook
 */

import { useEffect, useCallback } from 'react';
import { useApp, useModal, useToast } from '@/store/AppContext';
import { hasCustomVariables, getCustomVariables, processContentForCopy } from '@/utils/variables';

export function useKeyboardShortcuts() {
  const { state, dispatch } = useApp();
  const { modal, openModal, closeModal } = useModal();
  const { success, error } = useToast();

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    const isMod = e.ctrlKey || e.metaKey;

    // If modal is open, only handle escape
    if (modal.type !== 'none') {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
      return;
    }

    // Global shortcuts (work even in input)
    if (isMod) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          dispatch({ type: 'SET_SEARCH_MODE', payload: true });
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          searchInput?.focus();
          break;
        
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            dispatch({ type: 'REDO' });
          } else {
            e.preventDefault();
            dispatch({ type: 'UNDO' });
          }
          break;
        
        case 'y':
          e.preventDefault();
          dispatch({ type: 'REDO' });
          break;
        
        case ',':
          e.preventDefault();
          openModal('settings');
          break;
        
        case 'n':
          if (!isInput && state.activeTabId) {
            e.preventDefault();
            openModal('createCard');
          }
          break;
        
        case 't':
          if (!isInput && state.activeBoxId) {
            e.preventDefault();
            openModal('createTab');
          }
          break;
        
        case 'b':
          if (!isInput) {
            e.preventDefault();
            openModal('createBox');
          }
          break;
      }

      // Tab switching with Ctrl+1-9
      if (!isInput && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const boxTabs = state.tabs
          .filter(t => t.boxId === state.activeBoxId)
          .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.order - b.order;
          });
        
        if (boxTabs[tabIndex]) {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: boxTabs[tabIndex].id });
        }
      }

      // Ctrl+Tab / Ctrl+Shift+Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        const boxTabs = state.tabs
          .filter(t => t.boxId === state.activeBoxId)
          .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.order - b.order;
          });
        
        if (boxTabs.length === 0) return;
        
        const currentIndex = boxTabs.findIndex(t => t.id === state.activeTabId);
        let newIndex: number;
        
        if (e.shiftKey) {
          newIndex = currentIndex <= 0 ? boxTabs.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= boxTabs.length - 1 ? 0 : currentIndex + 1;
        }
        
        dispatch({ type: 'SET_ACTIVE_TAB', payload: boxTabs[newIndex].id });
      }

      return;
    }

    // Escape
    if (e.key === 'Escape') {
      if (state.isSearchMode) {
        e.preventDefault();
        dispatch({ type: 'SET_SEARCH_MODE', payload: false });
        dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
        dispatch({ type: 'SET_SEARCH_TAGS', payload: [] });
      } else if (state.selectedCardId) {
        e.preventDefault();
        dispatch({ type: 'SET_SELECTED_CARD', payload: null });
      }
      return;
    }

    // Shortcuts that require no input focus
    if (isInput) return;

    // ? for shortcuts
    if (e.key === '?') {
      e.preventDefault();
      openModal('keyboardShortcuts');
      return;
    }

    // Card-specific shortcuts (when card is selected)
    if (state.selectedCardId) {
      const selectedCard = state.cards.find(c => c.id === state.selectedCardId);
      if (!selectedCard) return;

      switch (e.key.toLowerCase()) {
        case 'c':
        case 'enter':
          e.preventDefault();
          if (hasCustomVariables(selectedCard.content)) {
            openModal('variableInput', { card: selectedCard, customVars: getCustomVariables(selectedCard.content) });
          } else {
            try {
              const processed = await processContentForCopy(selectedCard.content);
              await navigator.clipboard.writeText(processed);
              dispatch({ type: 'INCREMENT_COPY_COUNT', payload: selectedCard.id });
              success('Copied to clipboard');
            } catch {
              error('Failed to copy');
            }
          }
          break;
        
        case 'e':
          e.preventDefault();
          openModal('editCard', selectedCard);
          break;
        
        case 'p':
          e.preventDefault();
          dispatch({ 
            type: 'UPDATE_CARD', 
            payload: { id: selectedCard.id, updates: { pinned: !selectedCard.pinned } }
          });
          break;
        
        case 'delete':
        case 'backspace':
          e.preventDefault();
          openModal('deleteConfirm', { type: 'card', id: selectedCard.id, name: selectedCard.title });
          break;
      }
      return;
    }

    // Arrow navigation for cards
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const tabCards = state.cards
        .filter(c => c.tabId === state.activeTabId)
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return a.order - b.order;
        });
      
      if (tabCards.length === 0) return;
      
      const currentIndex = state.selectedCardId 
        ? tabCards.findIndex(c => c.id === state.selectedCardId)
        : -1;
      
      let newIndex = currentIndex;
      
      // Simple navigation - just go prev/next for now
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        newIndex = currentIndex <= 0 ? tabCards.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= tabCards.length - 1 ? 0 : currentIndex + 1;
      }
      
      dispatch({ type: 'SET_SELECTED_CARD', payload: tabCards[newIndex].id });
    }
  }, [state, modal, dispatch, openModal, closeModal, success, error]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
