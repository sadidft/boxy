import { create } from 'zustand';
import type { CardId } from '@/data/types';

export type ViewMode = 'grid' | 'list' | 'masonry';
export type SortMode = 'manual' | 'title' | 'newest' | 'updated' | 'mostCopied' | 'lastCopied';
export type FilterMode = 'all' | 'pinned' | 'hasVars' | 'recent' | `tag:${string}`;

export interface Toast {
  id: number;
  message: string;
  kind?: 'info' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
  timeout?: number;
}

interface UIState {
  view: ViewMode;
  sort: SortMode;
  filter: FilterMode;
  query: string;
  selectedCardId: CardId | null;
  paletteOpen: boolean;
  paletteInitial: string;
  shortcutsOpen: boolean;
  railCollapsed: boolean;
  online: boolean;
  toasts: Toast[];
  setView: (v: ViewMode) => void;
  setSort: (s: SortMode) => void;
  setFilter: (f: FilterMode) => void;
  setQuery: (q: string) => void;
  select: (id: CardId | null) => void;
  openPalette: (initial?: string) => void;
  closePalette: () => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleRail: () => void;
  setOnline: (online: boolean) => void;
  toast: (t: Omit<Toast, 'id'>) => number;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;
const VIEW_KEY = 'boxy.view';
const storedView = (): ViewMode => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === 'list' || v === 'masonry' ? v : 'grid';
  } catch {
    return 'grid';
  }
};

export const useUI = create<UIState>((set, get) => ({
  view: storedView(),
  sort: 'manual',
  filter: 'all',
  query: '',
  selectedCardId: null,
  paletteOpen: false,
  paletteInitial: '',
  shortcutsOpen: false,
  railCollapsed: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  toasts: [],
  setView: (view) => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // ignore
    }
    set({ view });
  },
  setSort: (sort) => set({ sort }),
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
  select: (selectedCardId) => set({ selectedCardId }),
  openPalette: (initial = '') => set({ paletteOpen: true, paletteInitial: initial }),
  closePalette: () => set({ paletteOpen: false }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  toggleRail: () => set({ railCollapsed: !get().railCollapsed }),
  setOnline: (online) => set({ online }),
  toast: (t) => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts.slice(-3), { id, ...t }] });
    const timeout = t.timeout ?? (t.action ? 8000 : 3000);
    if (timeout > 0) setTimeout(() => get().dismissToast(id), timeout);
    return id;
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));

export const toast = (message: string, opts: Omit<Toast, 'id' | 'message'> = {}) => useUI.getState().toast({ message, ...opts });
