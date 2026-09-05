import type { LabelColor } from '@/styles/tokens';

export type { LabelColor };

export type BoxId = string;
export type TabId = string;
export type CardId = string;

export type CardType = 'text' | 'table' | 'code' | 'checklist' | 'link' | 'fields' | 'vault' | 'color' | 'prompt' | 'image';

/** The card types the current build can create. Other types render as text until their release. */
export const enabledCardTypes = ['text', 'table'] as const satisfies readonly CardType[];

export type BoxColor = LabelColor | `#${string}`;

export interface BoxMeta {
  id: BoxId;
  name: string;
  icon: string;
  color: BoxColor;
  order: string;
  archived: boolean;
  sync: 'local' | 'cloud';
  cardCount: number;
  tabCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Tab {
  id: TabId;
  boxId: BoxId;
  name: string;
  icon: string;
  pinned: boolean;
  order: string;
  kind: 'manual' | 'smart';
  smartQuery?: string;
  createdAt: number;
  updatedAt: number;
}

export type ColumnType = 'text' | 'number' | 'date' | 'time' | 'formula';

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
  order: string;
  width?: number;
}

export interface TableRow {
  id: string;
  cells: Record<string, string>;
  order: string;
}

export interface TextBody {
  md: string;
}

export interface TableBody {
  columns: TableColumn[];
  rows: TableRow[];
  /** Formula DSL per column id, evaluated at render time (for example "sum//all"). */
  footer: Record<string, string>;
}

export type CardBody = TextBody | TableBody;

export interface VarMemory {
  last: string;
  history: string[];
}

export interface CardStats {
  copyCount: number;
  lastCopiedAt?: number;
  openCount: number;
}

export interface Card {
  id: CardId;
  boxId: BoxId;
  tabId: TabId;
  type: CardType;
  title: string;
  body: CardBody;
  tags: string[];
  label?: LabelColor;
  pinned: boolean;
  order: string;
  quickSlot?: number;
  vars: Record<string, VarMemory>;
  stats: CardStats;
  rev: number;
  createdAt: number;
  updatedAt: number;
}

/** Light projection kept in Dexie for lists, sort and filters. Never the source of truth. */
export interface CardIndex {
  id: CardId;
  boxId: BoxId;
  tabId: TabId;
  type: CardType;
  title: string;
  preview: string;
  tags: string[];
  pinned: number; // 1 | 0 (Dexie cannot index booleans)
  label?: LabelColor;
  order: string;
  quickSlot?: number;
  copyCount: number;
  lastCopiedAt?: number;
  hasVars: number; // 1 | 0
  bytes: number;
  createdAt: number;
  updatedAt: number;
}

export interface Revision {
  id: string;
  cardId: CardId;
  boxId: BoxId;
  rev: number;
  at: number;
  title: string;
  body: CardBody;
  bytes: number;
  reason: 'auto' | 'manual' | 'restore' | 'import';
}

export type TrashEntity = 'box' | 'tab' | 'card';

export interface TrashItem {
  id: string;
  entity: TrashEntity;
  entityId: string;
  boxId: BoxId;
  label: string;
  deletedAt: number;
  /** Snapshot sufficient to restore the entity with its children and ordering. */
  payload: unknown;
}

export interface GlobalVar {
  key: string;
  value: string;
  updatedAt: number;
}

export interface Counter {
  name: string;
  value: number;
  pad?: number;
  updatedAt: number;
}

export interface SettingRow {
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface MigrationLog {
  id: string;
  at: number;
  kind: 'legacy-handoff' | 'legacy-file' | 'json2' | 'csv';
  source: string;
  counts: Record<string, number>;
  warnings: string[];
  backupFile?: string;
}

export interface HandoffPayload {
  id: string;
  receivedAt: number;
  origin: string;
  primary: string | null;
  backup: string | null;
  imported: number; // 1 | 0
}

export type StorageMode =
  | { kind: 'local' }
  | { kind: 'boxy-cloud'; accountId: string; email: string; deviceId: string; trustedUntil?: number }
  | {
      kind: 'self-cloud';
      provider: 'tidb' | 'turso' | 'neon' | 'supabase' | 'mysql' | 'postgres';
      bridgeUrl: string;
      bridgeTokenEnc: string;
      dbHostMasked: string;
      redeployHookUrl?: string;
      workspaceId: string;
      deviceId: string;
    };

export type ThemeSetting = 'system' | 'dark' | 'light' | 'hc';

export interface Settings {
  theme: ThemeSetting;
  accent: LabelColor | 'custom';
  accentCustom?: string;
  density: 'comfortable' | 'compact';
  locale: 'auto' | 'en' | 'id';
  readingFont: boolean;
  textScale: 0.9 | 1 | 1.1 | 1.25;
  reducedMotion: 'system' | 'on' | 'off';
  onboardingDone: boolean;
  storageMode: StorageMode;
  lastBoxId?: BoxId;
  lastTabByBox: Record<BoxId, TabId>;
  autoBackup: { enabled: boolean; lastAt?: number; lastFile?: string };
  clipboardClearSeconds: 0 | 30 | 60;
}

export const defaultSettings: Settings = {
  theme: 'system',
  accent: 'mint',
  density: 'comfortable',
  locale: 'auto',
  readingFont: false,
  textScale: 1,
  reducedMotion: 'system',
  onboardingDone: false,
  storageMode: { kind: 'local' },
  lastTabByBox: {},
  autoBackup: { enabled: true },
  clipboardClearSeconds: 0,
};

export class BoxyError extends Error {
  constructor(
    public readonly code: 'NotFound' | 'Validation' | 'Quota' | 'Conflict' | 'Unsupported',
    message: string,
  ) {
    super(message);
    this.name = 'BoxyError';
  }
}
