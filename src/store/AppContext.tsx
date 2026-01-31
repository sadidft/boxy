/**
 * Boxy App State Context
 * Global state management using React Context
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AppState, Box, Tab, Card, Settings, Action, ModalState, Toast, ModalType } from '@/types';
import { loadState, saveState } from './storage';
import { generateId } from '@/utils/helpers';
import { LIMITS, DEBOUNCE } from '@/config/constants';
import { debounce } from '@/utils/helpers';

// Action types for the reducer
type AppAction =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SET_ACTIVE_BOX'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: string | null }
  | { type: 'SET_SELECTED_CARD'; payload: string | null }
  | { type: 'SET_SEARCH_MODE'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_TAGS'; payload: string[] }
  | { type: 'CREATE_BOX'; payload: Omit<Box, 'id' | 'order' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_BOX'; payload: { id: string; updates: Partial<Box> } }
  | { type: 'DELETE_BOX'; payload: string }
  | { type: 'CREATE_TAB'; payload: Omit<Tab, 'id' | 'order' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_TAB'; payload: { id: string; updates: Partial<Tab> } }
  | { type: 'DELETE_TAB'; payload: string }
  | { type: 'REORDER_TABS'; payload: { tabId: string; newOrder: number } }
  | { type: 'CREATE_CARD'; payload: Omit<Card, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'copyCount' | 'history'> }
  | { type: 'UPDATE_CARD'; payload: { id: string; updates: Partial<Card> } }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'REORDER_CARDS'; payload: { cardId: string; newOrder: number } }
  | { type: 'INCREMENT_COPY_COUNT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'IMPORT_FULL'; payload: { settings: Settings; boxes: Box[]; tabs: Tab[]; cards: Card[]; allTags: string[] } }
  | { type: 'IMPORT_BOX'; payload: { box: Box; tabs: Tab[]; cards: Card[] } }
  | { type: 'TOGGLE_MINIMIZE_BOX'; payload: string }
  | { type: 'TOGGLE_MAXIMIZE_BOX'; payload: string };

// Initial context value
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  modal: ModalState;
  setModal: (modal: ModalState) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'SET_ACTIVE_BOX': {
      const newActiveBoxId = action.payload;
      let newActiveTabId = state.activeTabId;
      
      if (newActiveBoxId) {
        const boxTabs = state.tabs.filter(t => t.boxId === newActiveBoxId);
        if (boxTabs.length > 0) {
          const pinnedTabs = boxTabs.filter(t => t.pinned).sort((a, b) => a.order - b.order);
          const regularTabs = boxTabs.filter(t => !t.pinned).sort((a, b) => a.order - b.order);
          newActiveTabId = (pinnedTabs[0] || regularTabs[0])?.id || null;
        } else {
          newActiveTabId = null;
        }
      } else {
        newActiveTabId = null;
      }
      
      return { ...state, activeBoxId: newActiveBoxId, activeTabId: newActiveTabId, selectedCardId: null };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload, selectedCardId: null };

    case 'SET_SELECTED_CARD':
      return { ...state, selectedCardId: action.payload };

    case 'SET_SEARCH_MODE':
      return { ...state, isSearchMode: action.payload };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_SEARCH_TAGS':
      return { ...state, searchTags: action.payload };

    case 'CREATE_BOX': {
      const now = Date.now();
      const newBox: Box = {
        id: generateId('box'),
        name: action.payload.name,
        icon: action.payload.icon,
        order: state.boxes.length,
        createdAt: now,
        updatedAt: now,
        isMinimized: action.payload.isMinimized ?? false,
        isMaximized: action.payload.isMaximized ?? false,
      };
      
      const newAction: Action = {
        id: generateId('box'),
        type: 'create',
        entity: 'box',
        entityId: newBox.id,
        previousState: null,
        newState: newBox,
        timestamp: now,
        description: `Created box "${newBox.name}"`,
      };
      
      return {
        ...state,
        boxes: [...state.boxes, newBox],
        activeBoxId: newBox.id,
        activeTabId: null,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'UPDATE_BOX': {
      const now = Date.now();
      const boxIndex = state.boxes.findIndex(b => b.id === action.payload.id);
      if (boxIndex === -1) return state;
      
      const oldBox = state.boxes[boxIndex];
      const updatedBox = { ...oldBox, ...action.payload.updates, updatedAt: now };
      const newBoxes = [...state.boxes];
      newBoxes[boxIndex] = updatedBox;
      
      const newAction: Action = {
        id: generateId('box'),
        type: 'update',
        entity: 'box',
        entityId: action.payload.id,
        previousState: oldBox,
        newState: updatedBox,
        timestamp: now,
        description: `Updated box "${updatedBox.name}"`,
      };
      
      return {
        ...state,
        boxes: newBoxes,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'DELETE_BOX': {
      const now = Date.now();
      const box = state.boxes.find(b => b.id === action.payload);
      if (!box) return state;
      
      const tabsToDelete = state.tabs.filter(t => t.boxId === action.payload);
      const tabIds = tabsToDelete.map(t => t.id);
      const cardsToDelete = state.cards.filter(c => tabIds.includes(c.tabId));
      
      const newAction: Action = {
        id: generateId('box'),
        type: 'delete',
        entity: 'box',
        entityId: action.payload,
        previousState: box,
        newState: null,
        cascadeData: [...tabsToDelete, ...cardsToDelete],
        timestamp: now,
        description: `Deleted box "${box.name}"`,
      };
      
      const newBoxes = state.boxes.filter(b => b.id !== action.payload);
      const newTabs = state.tabs.filter(t => t.boxId !== action.payload);
      const newCards = state.cards.filter(c => !tabIds.includes(c.tabId));
      
      let newActiveBoxId = state.activeBoxId;
      let newActiveTabId = state.activeTabId;
      
      if (state.activeBoxId === action.payload) {
        newActiveBoxId = newBoxes[0]?.id || null;
        if (newActiveBoxId) {
          const boxTabs = newTabs.filter(t => t.boxId === newActiveBoxId);
          newActiveTabId = boxTabs[0]?.id || null;
        } else {
          newActiveTabId = null;
        }
      }
      
      return {
        ...state,
        boxes: newBoxes,
        tabs: newTabs,
        cards: newCards,
        activeBoxId: newActiveBoxId,
        activeTabId: newActiveTabId,
        selectedCardId: null,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'CREATE_TAB': {
      const now = Date.now();
      const tabsInBox = state.tabs.filter(t => t.boxId === action.payload.boxId);
      
      const newTab: Tab = {
        id: generateId('tab'),
        boxId: action.payload.boxId,
        name: action.payload.name,
        icon: action.payload.icon,
        pinned: action.payload.pinned,
        order: tabsInBox.length,
        createdAt: now,
        updatedAt: now,
      };
      
      const newAction: Action = {
        id: generateId('tab'),
        type: 'create',
        entity: 'tab',
        entityId: newTab.id,
        previousState: null,
        newState: newTab,
        timestamp: now,
        description: `Created tab "${newTab.name}"`,
      };
      
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'UPDATE_TAB': {
      const now = Date.now();
      const tabIndex = state.tabs.findIndex(t => t.id === action.payload.id);
      if (tabIndex === -1) return state;
      
      const oldTab = state.tabs[tabIndex];
      const updatedTab = { ...oldTab, ...action.payload.updates, updatedAt: now };
      const newTabs = [...state.tabs];
      newTabs[tabIndex] = updatedTab;
      
      const newAction: Action = {
        id: generateId('tab'),
        type: 'update',
        entity: 'tab',
        entityId: action.payload.id,
        previousState: oldTab,
        newState: updatedTab,
        timestamp: now,
        description: `Updated tab "${updatedTab.name}"`,
      };
      
      return {
        ...state,
        tabs: newTabs,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'DELETE_TAB': {
      const now = Date.now();
      const tab = state.tabs.find(t => t.id === action.payload);
      if (!tab) return state;
      
      const cardsToDelete = state.cards.filter(c => c.tabId === action.payload);
      
      const newAction: Action = {
        id: generateId('tab'),
        type: 'delete',
        entity: 'tab',
        entityId: action.payload,
        previousState: tab,
        newState: null,
        cascadeData: cardsToDelete,
        timestamp: now,
        description: `Deleted tab "${tab.name}"`,
      };
      
      const newTabs = state.tabs.filter(t => t.id !== action.payload);
      const newCards = state.cards.filter(c => c.tabId !== action.payload);
      
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === action.payload) {
        const boxTabs = newTabs.filter(t => t.boxId === tab.boxId);
        newActiveTabId = boxTabs[0]?.id || null;
      }
      
      return {
        ...state,
        tabs: newTabs,
        cards: newCards,
        activeTabId: newActiveTabId,
        selectedCardId: null,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'REORDER_TABS': {
      const { tabId, newOrder } = action.payload;
      const tab = state.tabs.find(t => t.id === tabId);
      if (!tab) return state;
      
      const boxTabs = state.tabs.filter(t => t.boxId === tab.boxId);
      const otherTabs = state.tabs.filter(t => t.boxId !== tab.boxId);
      
      const reordered = boxTabs
        .filter(t => t.id !== tabId)
        .sort((a, b) => a.order - b.order);
      
      reordered.splice(newOrder, 0, tab);
      
      const updatedBoxTabs = reordered.map((t, index) => ({ ...t, order: index }));
      
      return {
        ...state,
        tabs: [...otherTabs, ...updatedBoxTabs],
      };
    }

    case 'CREATE_CARD': {
      const now = Date.now();
      const cardsInTab = state.cards.filter(c => c.tabId === action.payload.tabId);
      
      const newCard: Card = {
        id: generateId('card'),
        tabId: action.payload.tabId,
        title: action.payload.title,
        content: action.payload.content,
        tags: action.payload.tags,
        pinned: action.payload.pinned,
        copyCount: 0,
        order: cardsInTab.length,
        createdAt: now,
        updatedAt: now,
        history: [{ timestamp: now, action: 'created' }],
        table: action.payload.table,
      };
      
      // Update allTags
      const newTags = action.payload.tags.filter(t => !state.allTags.includes(t));
      
      const newAction: Action = {
        id: generateId('card'),
        type: 'create',
        entity: 'card',
        entityId: newCard.id,
        previousState: null,
        newState: newCard,
        timestamp: now,
        description: `Created card "${newCard.title}"`,
      };
      
      return {
        ...state,
        cards: [...state.cards, newCard],
        allTags: [...state.allTags, ...newTags],
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'UPDATE_CARD': {
      const now = Date.now();
      const cardIndex = state.cards.findIndex(c => c.id === action.payload.id);
      if (cardIndex === -1) return state;
      
      const oldCard = state.cards[cardIndex];
      const updatedCard = { 
        ...oldCard, 
        ...action.payload.updates, 
        updatedAt: now,
        history: [
          ...oldCard.history,
          { timestamp: now, action: 'edited' as const }
        ].slice(-LIMITS.maxHistoryEntries),
      };
      
      const newCards = [...state.cards];
      newCards[cardIndex] = updatedCard;
      
      // Update allTags if tags changed
      let newAllTags = state.allTags;
      if (action.payload.updates.tags) {
        const newTags = action.payload.updates.tags.filter(t => !state.allTags.includes(t));
        newAllTags = [...state.allTags, ...newTags];
      }
      
      const newAction: Action = {
        id: generateId('card'),
        type: 'update',
        entity: 'card',
        entityId: action.payload.id,
        previousState: oldCard,
        newState: updatedCard,
        timestamp: now,
        description: `Updated card "${updatedCard.title}"`,
      };
      
      return {
        ...state,
        cards: newCards,
        allTags: newAllTags,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'DELETE_CARD': {
      const now = Date.now();
      const card = state.cards.find(c => c.id === action.payload);
      if (!card) return state;
      
      const newAction: Action = {
        id: generateId('card'),
        type: 'delete',
        entity: 'card',
        entityId: action.payload,
        previousState: card,
        newState: null,
        timestamp: now,
        description: `Deleted card "${card.title}"`,
      };
      
      const newCards = state.cards.filter(c => c.id !== action.payload);
      
      return {
        ...state,
        cards: newCards,
        selectedCardId: state.selectedCardId === action.payload ? null : state.selectedCardId,
        actionHistory: [...state.actionHistory, newAction].slice(-LIMITS.maxUndoSteps),
        actionFuture: [],
      };
    }

    case 'REORDER_CARDS': {
      const { cardId, newOrder } = action.payload;
      const card = state.cards.find(c => c.id === cardId);
      if (!card) return state;
      
      const tabCards = state.cards.filter(c => c.tabId === card.tabId);
      const otherCards = state.cards.filter(c => c.tabId !== card.tabId);
      
      const reordered = tabCards
        .filter(c => c.id !== cardId)
        .sort((a, b) => a.order - b.order);
      
      reordered.splice(newOrder, 0, card);
      
      const updatedTabCards = reordered.map((c, index) => ({ ...c, order: index }));
      
      return {
        ...state,
        cards: [...otherCards, ...updatedTabCards],
      };
    }

    case 'INCREMENT_COPY_COUNT': {
      const now = Date.now();
      const cardIndex = state.cards.findIndex(c => c.id === action.payload);
      if (cardIndex === -1) return state;
      
      const card = state.cards[cardIndex];
      const updatedCard = {
        ...card,
        copyCount: card.copyCount + 1,
        history: [
          ...card.history,
          { timestamp: now, action: 'copied' as const }
        ].slice(-LIMITS.maxHistoryEntries),
      };
      
      const newCards = [...state.cards];
      newCards[cardIndex] = updatedCard;
      
      return { ...state, cards: newCards };
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'UNDO': {
      if (state.actionHistory.length === 0) return state;
      
      const lastAction = state.actionHistory[state.actionHistory.length - 1];
      let newState = { ...state };
      
      switch (lastAction.type) {
        case 'create':
          if (lastAction.entity === 'box') {
            newState.boxes = state.boxes.filter(b => b.id !== lastAction.entityId);
            if (state.activeBoxId === lastAction.entityId) {
              newState.activeBoxId = newState.boxes[0]?.id || null;
            }
          } else if (lastAction.entity === 'tab') {
            newState.tabs = state.tabs.filter(t => t.id !== lastAction.entityId);
            if (state.activeTabId === lastAction.entityId) {
              const boxTabs = newState.tabs.filter(t => t.boxId === state.activeBoxId);
              newState.activeTabId = boxTabs[0]?.id || null;
            }
          } else if (lastAction.entity === 'card') {
            newState.cards = state.cards.filter(c => c.id !== lastAction.entityId);
          }
          break;
          
        case 'update':
          if (lastAction.entity === 'box') {
            newState.boxes = state.boxes.map(b => 
              b.id === lastAction.entityId ? lastAction.previousState as Box : b
            );
          } else if (lastAction.entity === 'tab') {
            newState.tabs = state.tabs.map(t => 
              t.id === lastAction.entityId ? lastAction.previousState as Tab : t
            );
          } else if (lastAction.entity === 'card') {
            newState.cards = state.cards.map(c => 
              c.id === lastAction.entityId ? lastAction.previousState as Card : c
            );
          }
          break;
          
        case 'delete':
          if (lastAction.entity === 'box') {
            newState.boxes = [...state.boxes, lastAction.previousState as Box];
            if (lastAction.cascadeData) {
              const cascadeTabs = lastAction.cascadeData.filter((d: unknown) => (d as Tab).boxId);
              const cascadeCards = lastAction.cascadeData.filter((d: unknown) => (d as Card).tabId && !(d as Tab).boxId);
              newState.tabs = [...state.tabs, ...(cascadeTabs as Tab[])];
              newState.cards = [...state.cards, ...(cascadeCards as Card[])];
            }
          } else if (lastAction.entity === 'tab') {
            newState.tabs = [...state.tabs, lastAction.previousState as Tab];
            if (lastAction.cascadeData) {
              newState.cards = [...state.cards, ...(lastAction.cascadeData as Card[])];
            }
          } else if (lastAction.entity === 'card') {
            newState.cards = [...state.cards, lastAction.previousState as Card];
          }
          break;
      }
      
      return {
        ...newState,
        actionHistory: state.actionHistory.slice(0, -1),
        actionFuture: [...state.actionFuture, lastAction],
      };
    }

    case 'REDO': {
      if (state.actionFuture.length === 0) return state;
      
      const actionToRedo = state.actionFuture[state.actionFuture.length - 1];
      let newState = { ...state };
      
      switch (actionToRedo.type) {
        case 'create':
          if (actionToRedo.entity === 'box') {
            newState.boxes = [...state.boxes, actionToRedo.newState as Box];
          } else if (actionToRedo.entity === 'tab') {
            newState.tabs = [...state.tabs, actionToRedo.newState as Tab];
          } else if (actionToRedo.entity === 'card') {
            newState.cards = [...state.cards, actionToRedo.newState as Card];
          }
          break;
          
        case 'update':
          if (actionToRedo.entity === 'box') {
            newState.boxes = state.boxes.map(b => 
              b.id === actionToRedo.entityId ? actionToRedo.newState as Box : b
            );
          } else if (actionToRedo.entity === 'tab') {
            newState.tabs = state.tabs.map(t => 
              t.id === actionToRedo.entityId ? actionToRedo.newState as Tab : t
            );
          } else if (actionToRedo.entity === 'card') {
            newState.cards = state.cards.map(c => 
              c.id === actionToRedo.entityId ? actionToRedo.newState as Card : c
            );
          }
          break;
          
        case 'delete':
          if (actionToRedo.entity === 'box') {
            const boxId = actionToRedo.entityId;
            const tabIds = state.tabs.filter(t => t.boxId === boxId).map(t => t.id);
            newState.boxes = state.boxes.filter(b => b.id !== boxId);
            newState.tabs = state.tabs.filter(t => t.boxId !== boxId);
            newState.cards = state.cards.filter(c => !tabIds.includes(c.tabId));
          } else if (actionToRedo.entity === 'tab') {
            newState.tabs = state.tabs.filter(t => t.id !== actionToRedo.entityId);
            newState.cards = state.cards.filter(c => c.tabId !== actionToRedo.entityId);
          } else if (actionToRedo.entity === 'card') {
            newState.cards = state.cards.filter(c => c.id !== actionToRedo.entityId);
          }
          break;
      }
      
      return {
        ...newState,
        actionHistory: [...state.actionHistory, actionToRedo],
        actionFuture: state.actionFuture.slice(0, -1),
      };
    }

    case 'CLEAR_HISTORY':
      return { ...state, actionHistory: [], actionFuture: [] };

    case 'IMPORT_FULL':
      return {
        ...state,
        settings: action.payload.settings,
        boxes: action.payload.boxes,
        tabs: action.payload.tabs,
        cards: action.payload.cards,
        allTags: action.payload.allTags,
        activeBoxId: action.payload.boxes[0]?.id || null,
        activeTabId: action.payload.tabs.find(t => t.boxId === action.payload.boxes[0]?.id)?.id || null,
        actionHistory: [],
        actionFuture: [],
      };

    case 'IMPORT_BOX': {
      const newTags = action.payload.cards
        .flatMap(c => c.tags)
        .filter(t => !state.allTags.includes(t));
      
      return {
        ...state,
        boxes: [...state.boxes, action.payload.box],
        tabs: [...state.tabs, ...action.payload.tabs],
        cards: [...state.cards, ...action.payload.cards],
        allTags: [...state.allTags, ...newTags],
        activeBoxId: action.payload.box.id,
        activeTabId: action.payload.tabs[0]?.id || null,
      };
    }

    case 'TOGGLE_MINIMIZE_BOX': {
      const boxId = action.payload;
      return {
        ...state,
        boxes: state.boxes.map(box =>
          box.id === boxId
            ? { ...box, isMinimized: !box.isMinimized, isMaximized: false }
            : box
        ),
      };
    }

    case 'TOGGLE_MAXIMIZE_BOX': {
      const boxId = action.payload;
      const box = state.boxes.find(b => b.id === boxId);
      if (!box) return state;
      
      const isCurrentlyMaximized = box.isMaximized;
      
      return {
        ...state,
        boxes: state.boxes.map(b =>
          b.id === boxId
            ? { ...b, isMaximized: !isCurrentlyMaximized, isMinimized: false }
            : { ...b, isMaximized: false } // Unmaximize all others
        ),
        activeBoxId: boxId,
      };
    }

    default:
      return state;
  }
}

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, () => loadState());
  const [modal, setModal] = React.useState<ModalState>({ type: 'none' });
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // Debounced save
  const debouncedSave = useCallback(
    debounce((s: AppState) => {
      saveState(s);
    }, DEBOUNCE.save),
    []
  );

  // Save state whenever it changes
  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);

  // Add toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId('row');
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => {
      const updated = [...prev, newToast];
      // Keep only last N toasts
      return updated.slice(-LIMITS.maxToasts);
    });

    // Auto-remove after duration
    const duration = toast.duration || (toast.type === 'undo' ? 7000 : 4000);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    modal,
    setModal,
    toasts,
    addToast,
    removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Custom hook for modal
export function useModal() {
  const { modal, setModal } = useApp();
  
  const openModal = useCallback((type: ModalType, data?: unknown) => {
    setModal({ type, data });
  }, [setModal]);
  
  const closeModal = useCallback(() => {
    setModal({ type: 'none' });
  }, [setModal]);
  
  return { modal, openModal, closeModal };
}

// Custom hook for toasts
export function useToast() {
  const { addToast, removeToast } = useApp();
  
  const showToast = useCallback((type: Toast['type'], message: string, action?: Toast['action']) => {
    addToast({ type, message, action });
  }, [addToast]);
  
  const success = useCallback((message: string) => showToast('success', message), [showToast]);
  const error = useCallback((message: string) => showToast('error', message), [showToast]);
  const warning = useCallback((message: string) => showToast('warning', message), [showToast]);
  const info = useCallback((message: string) => showToast('info', message), [showToast]);
  
  return { showToast, success, error, warning, info, removeToast };
}
