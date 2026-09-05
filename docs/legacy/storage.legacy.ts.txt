/**
 * Boxy Storage Operations
 * Handles localStorage persistence
 */

import { APP_CONFIG, DEFAULT_SETTINGS } from '@/config/constants';
import type { AppState, StoredData, Box, Tab, Card } from '@/types';
import { calculateChecksum, generateId } from '@/utils/helpers';

/**
 * Get initial default state
 */
export function getDefaultState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    boxes: [],
    tabs: [],
    cards: [],
    allTags: [],
    actionHistory: [],
    actionFuture: [],
    activeBoxId: null,
    activeTabId: null,
    selectedCardId: null,
    searchQuery: '',
    searchTags: [],
    isSearchMode: false,
  };
}

/**
 * Load state from localStorage
 */
export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(APP_CONFIG.storageKey);
    if (!stored) {
      return createInitialDataWithSample();
    }

    const data: StoredData = JSON.parse(stored);
    
    // Validate basic structure
    if (!data._version || !data.boxes || !data.tabs || !data.cards) {
      console.warn('Invalid stored data structure, loading backup...');
      return loadBackup();
    }

    // Apply migrations if needed
    const migratedData = applyMigrations(data);

    const state: AppState = {
      settings: migratedData.settings || { ...DEFAULT_SETTINGS },
      boxes: migratedData.boxes || [],
      tabs: migratedData.tabs || [],
      cards: migratedData.cards || [],
      allTags: migratedData.allTags || [],
      actionHistory: migratedData.actionHistory || [],
      actionFuture: migratedData.actionFuture || [],
      activeBoxId: migratedData.boxes?.[0]?.id || null,
      activeTabId: null,
      selectedCardId: null,
      searchQuery: '',
      searchTags: [],
      isSearchMode: false,
    };

    // Set active tab to first tab of active box
    if (state.activeBoxId) {
      const firstTab = state.tabs.find(t => t.boxId === state.activeBoxId);
      state.activeTabId = firstTab?.id || null;
    }

    console.log(`[Boxy] Loaded from localStorage: ${state.boxes.length} boxes, ${state.tabs.length} tabs, ${state.cards.length} cards`);

    return state;
  } catch (error) {
    console.error('Failed to load state:', error);
    return loadBackup();
  }
}

/**
 * Load from backup storage
 */
function loadBackup(): AppState {
  try {
    const backup = localStorage.getItem(APP_CONFIG.backupKey);
    if (!backup) {
      return createInitialDataWithSample();
    }

    const data = JSON.parse(backup);
    const state = getDefaultState();
    
    // Apply migrations to ensure all required fields exist
    state.boxes = (data.boxes || []).map((box: Box) => ({
      ...box,
      isMinimized: box.isMinimized ?? false,
      isMaximized: box.isMaximized ?? false,
    }));
    state.tabs = data.tabs || [];
    state.cards = (data.cards || []).map((card: Card) => ({
      ...card,
      history: card.history ?? [],
      table: card.table ?? null,
    }));

    if (state.boxes.length > 0) {
      state.activeBoxId = state.boxes[0].id;
      const firstTab = state.tabs.find(t => t.boxId === state.activeBoxId);
      state.activeTabId = firstTab?.id || null;
    }

    console.log(`[Boxy] Loaded from backup: ${state.boxes.length} boxes, ${state.tabs.length} tabs, ${state.cards.length} cards`);

    return state;
  } catch (error) {
    console.error('Failed to load backup:', error);
    return createInitialDataWithSample();
  }
}

/**
 * Create initial state with sample data
 */
function createInitialDataWithSample(): AppState {
  const state = getDefaultState();
  const now = Date.now();

  // Create sample box
  const box: Box = {
    id: generateId('box'),
    name: 'My Workspace',
    icon: 'boxy',
    order: 0,
    createdAt: now,
    updatedAt: now,
    isMinimized: false,
    isMaximized: false,
  };

  // Create sample tabs
  const tab1: Tab = {
    id: generateId('tab'),
    boxId: box.id,
    name: 'Quick Snippets',
    icon: 'boxy',
    pinned: true,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };

  const tab2: Tab = {
    id: generateId('tab'),
    boxId: box.id,
    name: 'Email Templates',
    icon: 'mail',
    pinned: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  };

  // Create sample cards
  const card1: Card = {
    id: generateId('card'),
    tabId: tab1.id,
    title: 'Welcome to Boxy! 🎉',
    content: `# Getting Started

Boxy is your **offline clipboard manager**. Here's what you can do:

- Create **Boxes** for different contexts (Work, Personal, etc.)
- Organize with **Tabs** within each Box
- Store snippets in **Cards** with Markdown support

## Template Variables

Use \`{{date}}\` for today's date: **{{date}}**
Use \`{{time}}\` for current time: **{{time}}**
Use \`{{name}}\` for custom input that prompts you when copying.

## Keyboard Shortcuts

- \`Ctrl/Cmd + N\` - New Card
- \`Ctrl/Cmd + K\` - Search
- \`Ctrl/Cmd + Z\` - Undo
- \`?\` - Show all shortcuts`,
    tags: ['welcome', 'guide'],
    pinned: true,
    copyCount: 0,
    order: 0,
    createdAt: now,
    updatedAt: now,
    history: [{ timestamp: now, action: 'created' }],
    table: null,
  };

  const card2: Card = {
    id: generateId('card'),
    tabId: tab1.id,
    title: 'Code Snippet Example',
    content: `\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

A simple JavaScript greeting function.`,
    tags: ['code', 'javascript'],
    pinned: false,
    copyCount: 0,
    order: 1,
    createdAt: now,
    updatedAt: now,
    history: [{ timestamp: now, action: 'created' }],
    table: null,
  };

  const card3: Card = {
    id: generateId('card'),
    tabId: tab2.id,
    title: 'Quick Reply Template',
    content: `Hi {{name}},

Thank you for reaching out! I've received your message and will get back to you within 24 hours.

Best regards,
{{sender_name}}

---
Sent on {{date}} at {{time}}`,
    tags: ['email', 'template'],
    pinned: false,
    copyCount: 0,
    order: 0,
    createdAt: now,
    updatedAt: now,
    history: [{ timestamp: now, action: 'created' }],
    table: null,
  };

  state.boxes = [box];
  state.tabs = [tab1, tab2];
  state.cards = [card1, card2, card3];
  state.allTags = ['welcome', 'guide', 'code', 'javascript', 'email', 'template'];
  state.activeBoxId = box.id;
  state.activeTabId = tab1.id;

  // Save initial state
  saveState(state);

  return state;
}

/**
 * Save state to localStorage
 */
export function saveState(state: AppState): boolean {
  try {
    const dataToStore: StoredData = {
      _version: APP_CONFIG.version,
      _lastUpdated: Date.now(),
      _checksum: '',
      settings: state.settings,
      boxes: state.boxes,
      tabs: state.tabs,
      cards: state.cards.map(card => ({
        ...card,
        // Limit history entries
        history: card.history ? card.history.slice(-4) : [],
      })),
      allTags: [...new Set(state.allTags)],
      actionHistory: state.actionHistory.slice(-7),
      actionFuture: state.actionFuture,
    };

    const jsonString = JSON.stringify(dataToStore);
    dataToStore._checksum = calculateChecksum(jsonString);

    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(dataToStore));

    // Also save minimal backup
    saveBackup(state);

    // Debug logging
    console.log(`[Boxy] Saved to localStorage: ${state.boxes.length} boxes, ${state.tabs.length} tabs, ${state.cards.length} cards`);

    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      // Try to clear action history and retry
      try {
        const minimalData: StoredData = {
          _version: APP_CONFIG.version,
          _lastUpdated: Date.now(),
          _checksum: '',
          settings: state.settings,
          boxes: state.boxes,
          tabs: state.tabs,
          cards: state.cards,
          allTags: state.allTags,
          actionHistory: [],
          actionFuture: [],
        };
        localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(minimalData));
        return true;
      } catch {
        return false;
      }
    }
    console.error('Failed to save state:', error);
    return false;
  }
}

/**
 * Save minimal backup
 */
function saveBackup(state: AppState): void {
  try {
    const backup = {
      boxes: state.boxes,
      tabs: state.tabs,
      cards: state.cards.map(c => ({
        id: c.id,
        tabId: c.tabId,
        title: c.title,
        content: c.content,
        tags: c.tags,
        pinned: c.pinned,
        order: c.order,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
    localStorage.setItem(APP_CONFIG.backupKey, JSON.stringify(backup));
  } catch {
    // Backup save failed, but primary save might have succeeded
  }
}

/**
 * Apply data migrations
 */
function applyMigrations(data: StoredData): StoredData {
  // Ensure all boxes have isMinimized and isMaximized fields
  if (data.boxes) {
    data.boxes = data.boxes.map(box => ({
      ...box,
      isMinimized: box.isMinimized ?? false,
      isMaximized: box.isMaximized ?? false,
    }));
  }

  // Ensure all cards have history array
  if (data.cards) {
    data.cards = data.cards.map(card => ({
      ...card,
      history: card.history ?? [],
      table: card.table ?? null,
    }));
  }

  return data;
}

/**
 * Clear all stored data
 */
export function clearAllData(): void {
  localStorage.removeItem(APP_CONFIG.storageKey);
  localStorage.removeItem(APP_CONFIG.backupKey);
}

/**
 * Export all data
 */
export function exportAllData(state: AppState): string {
  const exportData = {
    _meta: {
      app: APP_CONFIG.name,
      version: APP_CONFIG.version,
      exportedAt: new Date().toISOString(),
      type: 'full',
    },
    settings: state.settings,
    boxes: state.boxes,
    tabs: state.tabs,
    cards: state.cards,
    allTags: state.allTags,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Export single box with its data
 */
export function exportBox(state: AppState, boxId: string): string {
  const box = state.boxes.find(b => b.id === boxId);
  if (!box) throw new Error('Box not found');

  const tabs = state.tabs.filter(t => t.boxId === boxId);
  const tabIds = tabs.map(t => t.id);
  const cards = state.cards.filter(c => tabIds.includes(c.tabId));

  const exportData = {
    _meta: {
      app: APP_CONFIG.name,
      version: APP_CONFIG.version,
      exportedAt: new Date().toISOString(),
      type: 'box',
    },
    box,
    tabs,
    cards,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Validate import data
 */
export function validateImportData(jsonString: string): {
  valid: boolean;
  error?: string;
  data?: unknown;
  type?: 'full' | 'box';
} {
  try {
    const data = JSON.parse(jsonString);

    if (!data._meta || data._meta.app !== APP_CONFIG.name) {
      return { valid: false, error: 'This file is not a Boxy export file.' };
    }

    if (data._meta.type === 'full') {
      if (!data.settings || !Array.isArray(data.boxes) || !Array.isArray(data.tabs) || !Array.isArray(data.cards)) {
        return { valid: false, error: 'File appears to be corrupted. Some data may be missing.' };
      }
      return { valid: true, data, type: 'full' };
    }

    if (data._meta.type === 'box') {
      if (!data.box || !Array.isArray(data.tabs) || !Array.isArray(data.cards)) {
        return { valid: false, error: 'File appears to be corrupted. Some data may be missing.' };
      }
      return { valid: true, data, type: 'box' };
    }

    return { valid: false, error: 'Unknown export type.' };
  } catch {
    return { valid: false, error: 'Invalid file format. Please select a valid Boxy export file.' };
  }
}
