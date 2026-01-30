/**
 * Boxy Configuration Constants
 * @version 1.0.23
 */

export const APP_CONFIG = {
  name: 'Boxy',
  tagline: 'Your offline clipboard manager',
  version: '1.0.23',
  storageKey: 'boxy_data_v1',
  backupKey: 'boxy_minimal_backup',
} as const;

export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  primaryColor: '#0ea5e9',
  recentColors: [] as string[],
  features: {
    tableInCards: true,
    autoRecordHistory: true,
    cardDragDrop: true,
    tabDragReorder: true,
    masonryLayout: true,
  },
  limits: {
    maxBoxes: 10,
    maxTabsPerBox: 12,
    maxCardsPerTab: 50,
    maxColumnsPerTable: 10,
    bypassLimits: false,
  },
};

export const LIMITS = {
  maxUndoSteps: 7,
  maxHistoryEntries: 4,
  maxToasts: 3,
  maxRecentColors: 5,
} as const;

export const DEBOUNCE = {
  search: 300,
  save: 500,
  resize: 100,
  tooltip: 300,
  preview: 500,
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
} as const;

// Built-in template variables that are auto-replaced
export const BUILTIN_VARIABLES = [
  'date',
  'time',
  'datetime',
  'today',
  'now',
  'timestamp',
  'random',
  'uuid',
  'clipboard',
  'weekday',
  'month',
  'year',
] as const;

// Formula types supported in tables
export const FORMULA_TYPES = [
  'mnt', 'hrs', 'sec', 'dur',    // Time formulas
  'sum', 'avg', 'max', 'min', 'cnt', 'diff', // Numeric formulas
  'days', 'weeks',               // Date formulas
  'last', 'first', 'pct', 'inc', 'streak', // Special formulas
] as const;
