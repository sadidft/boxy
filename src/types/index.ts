/**
 * Boxy Type Definitions
 * @version 1.0.23
 */

// ============ Settings Types ============
export interface Settings {
  theme: 'system' | 'dark' | 'light';
  primaryColor: string;
  recentColors: string[];
  features: FeatureSettings;
  limits: LimitSettings;
}

export interface FeatureSettings {
  tableInCards: boolean;
  autoRecordHistory: boolean;
  cardDragDrop: boolean;
  tabDragReorder: boolean;
  masonryLayout: boolean;
}

export interface LimitSettings {
  maxBoxes: number;
  maxTabsPerBox: number;
  maxCardsPerTab: number;
  maxColumnsPerTable: number;
  bypassLimits: boolean;
}

// ============ Entity Types ============
export interface Box {
  id: string;
  name: string;
  icon: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface Tab {
  id: string;
  boxId: string;
  name: string;
  icon: string;
  pinned: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Card {
  id: string;
  tabId: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  copyCount: number;
  order: number;
  createdAt: number;
  updatedAt: number;
  history: HistoryEntry[];
  table: TableData | null;
}

export interface HistoryEntry {
  timestamp: number;
  action: 'created' | 'edited' | 'copied';
}

export interface TableData {
  mode: 'history' | 'custom';
  columns: ColumnDef[];
  rows: RowData[];
}

export interface ColumnDef {
  id: string;
  name: string;
  order: number;
}

export interface RowData {
  id: string;
  cells: Record<string, string>;
  order: number;
}

// ============ Undo/Redo Types ============
export interface Action {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  entity: 'box' | 'tab' | 'card';
  entityId: string;
  previousState: unknown;
  newState: unknown;
  cascadeData?: unknown[];
  timestamp: number;
  description: string;
}

// ============ State Types ============
export interface AppState {
  settings: Settings;
  boxes: Box[];
  tabs: Tab[];
  cards: Card[];
  allTags: string[];
  actionHistory: Action[];
  actionFuture: Action[];
  // UI State
  activeBoxId: string | null;
  activeTabId: string | null;
  selectedCardId: string | null;
  searchQuery: string;
  searchTags: string[];
  isSearchMode: boolean;
}

// ============ Modal Types ============
export type ModalType = 
  | 'none'
  | 'createBox'
  | 'editBox'
  | 'createTab'
  | 'editTab'
  | 'createCard'
  | 'editCard'
  | 'deleteConfirm'
  | 'settings'
  | 'iconPicker'
  | 'variableInput'
  | 'keyboardShortcuts'
  | 'formulaGuide'
  | 'export'
  | 'import'
  | 'expandedEditor';

export interface ModalState {
  type: ModalType;
  data?: unknown;
}

// ============ Toast Types ============
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'undo';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

// ============ Storage Types ============
export interface StoredData {
  _version: string;
  _lastUpdated: number;
  _checksum: string;
  settings: Settings;
  boxes: Box[];
  tabs: Tab[];
  cards: Card[];
  allTags: string[];
  actionHistory: Action[];
  actionFuture: Action[];
}
