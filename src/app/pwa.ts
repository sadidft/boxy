import { create } from 'zustand';

/**
 * PWA glue: install prompt, persistent storage, service worker update flow.
 * The SW is registered from main.tsx via virtual:pwa-register (prompt mode); this store keeps the UI state.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  installEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
  persisted: boolean | null;
  updateReady: boolean;
  offlineReady: boolean;
  applyUpdate: (() => Promise<void>) | null;
  install: () => Promise<boolean>;
  requestPersist: () => Promise<boolean>;
  setUpdate: (apply: () => Promise<void>) => void;
  setOfflineReady: () => void;
}

const standalone = () => (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: window-controls-overlay)').matches)) || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const usePwa = create<PwaState>((set, get) => ({
  installEvent: null,
  installed: typeof window !== 'undefined' ? standalone() : false,
  persisted: null,
  updateReady: false,
  offlineReady: false,
  applyUpdate: null,
  install: async () => {
    const ev = get().installEvent;
    if (!ev) return false;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') set({ installEvent: null, installed: true });
    return outcome === 'accepted';
  },
  requestPersist: async () => {
    if (!('storage' in navigator) || !navigator.storage?.persist) return false;
    const ok = await navigator.storage.persist();
    set({ persisted: ok });
    return ok;
  },
  setUpdate: (apply) => set({ updateReady: true, applyUpdate: apply }),
  setOfflineReady: () => set({ offlineReady: true }),
}));

export function initPwaListeners(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwa.setState({ installEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => usePwa.setState({ installed: true, installEvent: null }));
  if ('storage' in navigator && navigator.storage?.persisted) {
    void navigator.storage.persisted().then((p) => usePwa.setState({ persisted: p }));
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!('storage' in navigator) || !navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
}
