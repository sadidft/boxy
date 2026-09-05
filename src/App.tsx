import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate, useParams, useRouterState } from '@tanstack/react-router';
import type { Card } from '@/data/types';
import { getCard } from '@/data/repo/cards';
import { canRedo, canUndo, redo, undo } from '@/data/repo/undo';
import { useBoxes, useRecentCopied, useTabs } from '@/hooks/data';
import { useSettings } from '@/app/settings-store';
import { useUI } from '@/app/ui-store';
import { usePwa } from '@/app/pwa';
import { ShellContext, useShell, type ShellActions } from '@/app/shell-context';
import { copyCardById, copyCard } from '@/app/actions';
import { exportAll } from '@/app/backup';
import { getDB } from '@/data/db';
import { Rail } from '@/components/shell/Rail';
import { BoxDialog } from '@/components/dialogs/BoxDialog';
import { QuickBar } from '@/components/shell/QuickBar';
import { Palette, type Command } from '@/components/palette/Palette';
import { FillDialog } from '@/components/cards/FillDialog';
import { Toaster } from '@/components/ui/Toaster';
import { Button, Dialog } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { ShortcutList } from '@/components/shell/ShortcutList';
import { BoxAvatar } from '@/components/shell/Rail';
import { useMediaQuery } from '@/hooks/media';
import { consumeLaunchAction } from '@/app/launch';
import { modKey } from '@/hooks/format';

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable));
}

export function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams({ strict: false }) as { boxId?: string; tabId?: string; cardId?: string };
  const boxes = useBoxes();
  const tabs = useTabs(params.boxId);
  const [fillCard, setFillCard] = useState<Card | null>(null);
  const [boxDialog, setBoxDialog] = useState(false);
  const newCardRef = useRef<(() => void) | null>(null);
  const openPalette = useUI((s) => s.openPalette);
  const paletteOpen = useUI((s) => s.paletteOpen);
  const shortcutsOpen = useUI((s) => s.shortcutsOpen);
  const setShortcutsOpen = useUI((s) => s.setShortcutsOpen);
  const railCollapsed = useUI((s) => s.railCollapsed);
  const toggleRail = useUI((s) => s.toggleRail);
  const setOnline = useUI((s) => s.setOnline);
  const setView = useUI((s) => s.setView);
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const pending = useRouterState({ select: (s) => s.status === 'pending' });

  const openFill = useCallback((card: Card) => setFillCard(card), []);
  const openFillById = useCallback((boxId: string, cardId: string) => {
    void getCard(boxId, cardId).then((c) => c && setFillCard(c));
  }, []);
  const shellActions = useMemo<ShellActions>(
    () => ({
      openFill,
      openFillById,
      setNewCard: (fn) => {
        newCardRef.current = fn;
      },
      newCard: () => {
        if (newCardRef.current) newCardRef.current();
        else if (boxes?.[0]) void navigate({ to: '/b/$boxId', params: { boxId: boxes[0].id } });
      },
    }),
    [openFill, openFillById, boxes, navigate],
  );

  // Online state and URL actions (PWA shortcuts).
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [setOnline]);
  useEffect(() => {
    const action = consumeLaunchAction();
    if (action === 'search') openPalette();
    if (action === 'new-card') setTimeout(() => shellActions.newCard(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cycleTheme = useCallback(() => {
    const order = ['system', 'dark', 'light', 'hc'] as const;
    const next = order[(order.indexOf(settings.theme) + 1) % order.length]!;
    void update({ theme: next });
  }, [settings.theme, update]);

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: 'new-card', label: t('palette.cmdNewCard'), icon: 'plus', shortcut: `${modKey}+N`, run: () => shellActions.newCard() },
      { id: 'new-tab', label: t('palette.cmdNewTab'), icon: 'folder-plus', run: () => document.dispatchEvent(new CustomEvent('boxy:new-tab')) },
      { id: 'new-box', label: t('palette.cmdNewBox'), icon: 'box', run: () => setBoxDialog(true) },
      { id: 'paste', label: t('palette.cmdPasteCard'), icon: 'clipboard-paste', shortcut: `${modKey}+V`, run: () => void navigator.clipboard?.readText().then((text) => text && document.dispatchEvent(new CustomEvent('boxy:paste', { detail: text }))) },
      { id: 'search-all', label: t('palette.cmdSearchAll'), icon: 'search', run: () => void navigate({ to: '/search', search: { q: '' } }) },
      { id: 'recent', label: t('palette.cmdRecent'), icon: 'history', run: () => openPalette('is:recent ') },
      { id: 'view', label: t('palette.cmdToggleView'), icon: 'layout-grid', run: () => setView(useUI.getState().view === 'grid' ? 'list' : useUI.getState().view === 'list' ? 'masonry' : 'grid') },
      { id: 'theme', label: t('palette.cmdTheme'), icon: 'sun-moon', shortcut: `${modKey}+Shift+L`, run: cycleTheme },
      { id: 'compact', label: t('palette.cmdCompact'), icon: 'rows-3', run: () => void update({ density: settings.density === 'compact' ? 'comfortable' : 'compact' }) },
      { id: 'undo', label: t('palette.cmdUndo'), icon: 'undo-2', shortcut: `${modKey}+Z`, run: () => params.boxId && void undo(params.boxId) },
      { id: 'redo', label: t('palette.cmdRedo'), icon: 'redo-2', shortcut: `${modKey}+Shift+Z`, run: () => params.boxId && void redo(params.boxId) },
      { id: 'variables', label: t('palette.cmdVariables'), icon: 'braces', run: () => void navigate({ to: '/settings/$section', params: { section: 'variables' } }) },
      { id: 'settings', label: t('palette.cmdSettings'), icon: 'settings', run: () => void navigate({ to: '/settings/$section', params: { section: 'appearance' } }) },
      { id: 'trash', label: t('palette.cmdTrash'), icon: 'trash-2', run: () => void navigate({ to: '/trash' }) },
      { id: 'import', label: t('palette.cmdImport'), icon: 'arrow-down-to-line', run: () => void navigate({ to: '/import' }) },
      { id: 'export', label: t('palette.cmdExport'), icon: 'download', run: () => void exportAll() },
      { id: 'shortcuts', label: t('palette.cmdShortcuts'), icon: 'keyboard', shortcut: '?', run: () => setShortcutsOpen(true) },
    ];
    for (const b of boxes ?? []) list.push({ id: `go-${b.id}`, label: `${t('palette.cmdGoBox')}: ${b.name}`, icon: b.icon || 'box', keywords: b.name, run: () => void navigate({ to: '/b/$boxId', params: { boxId: b.id } }) });
    return list;
  }, [t, shellActions, params.boxId, navigate, openPalette, setView, cycleTheme, update, settings.density, setShortcutsOpen, boxes]);

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        shellActions.newCard();
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        cycleTheme();
        return;
      }
      if (e.altKey && !mod && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const slot = Number(e.key);
        void getDB()
          .cards_index.where('quickSlot')
          .equals(slot)
          .first()
          .then((row) => row && copyCardById(row.boxId, row.id).then((card) => card && setFillCard(card)));
        return;
      }
      if (mod && !e.altKey && /^[1-9]$/.test(e.key)) {
        const box = boxes?.[Number(e.key) - 1];
        if (box) {
          e.preventDefault();
          void navigate({ to: '/b/$boxId', params: { boxId: box.id } });
        }
        return;
      }
      if (mod && (e.key === ']' || e.key === '[') && params.boxId && tabs?.length) {
        e.preventDefault();
        const i = tabs.findIndex((x) => x.id === params.tabId);
        const next = tabs[(i + (e.key === ']' ? 1 : tabs.length - 1)) % tabs.length]!;
        void navigate({ to: '/b/$boxId/t/$tabId', params: { boxId: params.boxId, tabId: next.id } });
        return;
      }
      if (isTyping()) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && params.boxId) {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo(params.boxId)) void redo(params.boxId);
        } else if (canUndo(params.boxId)) void undo(params.boxId);
        return;
      }
      if (e.key === 'Escape' && params.cardId && params.boxId && params.tabId && !paletteOpen && !fillCard && !shortcutsOpen) {
        void navigate({ to: '/b/$boxId/t/$tabId', params: { boxId: params.boxId, tabId: params.tabId } });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPalette, shellActions, boxes, navigate, params, tabs, cycleTheme, setShortcutsOpen, paletteOpen, fillCard, shortcutsOpen]);

  const isBoxRoute = location.pathname.startsWith('/b/');
  const fullBleed = location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/import/handoff');

  if (fullBleed) {
    return (
      <ShellContext.Provider value={shellActions}>
        <Outlet />
        <FillDialog card={fillCard} onClose={() => setFillCard(null)} />
        <Toaster />
      </ShellContext.Provider>
    );
  }

  return (
    <ShellContext.Provider value={shellActions}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded-control focus:bg-accent focus:px-3 focus:py-1.5 focus:text-on-accent-fill">
        {t('shell.skipToContent')}
      </a>
      <div className="grain flex h-dvh w-full overflow-hidden bg-bg text-text">
        {!isMobile ? (
          <div className={`${railCollapsed && !isDesktop ? 'hidden' : 'flex'} h-full shrink-0`}>
            <Rail activeBoxId={params.boxId} />
          </div>
        ) : null}
        {isMobile && railCollapsed ? (
          <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label={t('shell.boxes')}>
            <div className="h-full bg-surface shadow-[var(--shadow)]">
              <Rail activeBoxId={params.boxId} />
            </div>
            <button type="button" className="flex-1 bg-black/40" aria-label={t('common.close')} onClick={toggleRail} />
          </div>
        ) : null}
        <main id="main" className="relative flex min-w-0 flex-1 flex-col">
          {pending ? <div className="absolute top-0 right-0 left-0 z-30 h-0.5 animate-pulse bg-accent" /> : null}
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
          {isDesktop && isBoxRoute ? <QuickBar onNeedsFill={openFillById} /> : null}
          {isMobile ? <MobileNav boxId={params.boxId} onNewCard={() => shellActions.newCard()} /> : null}
        </main>
      </div>
      <Palette commands={commands} onNeedsFill={openFillById} />
      <FillDialog card={fillCard} onClose={() => setFillCard(null)} />
      <BoxDialog open={boxDialog} onOpenChange={setBoxDialog} onCreated={(id) => void navigate({ to: '/b/$boxId', params: { boxId: id } })} />
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} title={t('shell.shortcutsHelp')} width="lg">
        <ShortcutList />
      </Dialog>
      <UpdateBanner />
      <Toaster />
    </ShellContext.Provider>
  );
}

function MobileNav({ boxId, onNewCard }: { boxId?: string; onNewCard: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const openPalette = useUI((s) => s.openPalette);
  const toggleRail = useUI((s) => s.toggleRail);
  const [recentOpen, setRecentOpen] = useState(false);
  const item = (active: boolean, icon: string, label: string, onClick: () => void) => (
    <button type="button" className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[0.7em] ${active ? 'text-accent' : 'text-muted'}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <Icon name={icon} size={20} />
      {label}
    </button>
  );
  if (location.pathname.includes('/c/')) return null;
  return (
    <>
      <nav className="relative flex items-stretch border-t border-line bg-surface safe-bottom" aria-label={t('shell.mobileNav')}>
        {item(location.pathname.startsWith('/b/'), 'box', t('shell.navBoxes'), toggleRail)}
        {item(false, 'search', t('shell.navSearch'), () => openPalette())}
        <div className="flex w-16 items-center justify-center">
          <button type="button" className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent-fill text-on-accent-fill shadow-[var(--shadow)]" aria-label={t('palette.cmdNewCard')} onClick={onNewCard} disabled={!boxId}>
            <Icon name="plus" size={22} strokeWidth={2.4} />
          </button>
        </div>
        {item(recentOpen, 'history', t('shell.navRecent'), () => setRecentOpen(true))}
        {item(location.pathname.startsWith('/settings'), 'settings', t('shell.navMore'), () => void navigate({ to: '/settings/$section', params: { section: 'appearance' } }))}
      </nav>
      <RecentSheet open={recentOpen} onOpenChange={setRecentOpen} />
    </>
  );
}

function RecentSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const recent = useRecentCopied(20);
  const boxes = useBoxes(true);
  const shell = useShell();
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('shell.recentTitle')} width="sm">
      {recent?.length ? (
        <ul className="flex flex-col gap-1">
          {recent.map((r) => {
            const box = boxes?.find((b) => b.id === r.boxId);
            return (
              <li key={r.id} className="flex items-center gap-2 rounded-control border border-line px-2 py-1.5">
                {box ? <BoxAvatar box={box} size={22} /> : null}
                <Link to="/b/$boxId/t/$tabId/c/$cardId" params={{ boxId: r.boxId, tabId: r.tabId, cardId: r.id }} className="min-w-0 flex-1 truncate" onClick={() => onOpenChange(false)}>
                  {r.title || t('common.untitled')}
                </Link>
                <Button
                  size="sm"
                  variant="accent"
                  icon="copy"
                  onClick={() => {
                    onOpenChange(false);
                    void getCard(r.boxId, r.id).then((c) => c && copyCard(c).then((ok) => !ok && shell.openFill(c)));
                  }}
                >
                  {t('cards.copy')}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[0.95em] text-muted">{t('shell.recentEmpty')}</p>
      )}
    </Dialog>
  );
}

function UpdateBanner() {
  const { t } = useTranslation();
  const updateReady = usePwa((s) => s.updateReady);
  const applyUpdate = usePwa((s) => s.applyUpdate);
  const [hidden, setHidden] = useState(false);
  if (!updateReady || hidden || !applyUpdate) return null;
  return (
    <div className="panel fixed top-3 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 px-3 py-2 text-[0.95em] slide-up" role="status">
      <Icon name="refresh-cw" size={16} className="text-accent" />
      <span>{t('pwa.updateReady')}</span>
      <Button size="sm" variant="primary" onClick={() => void applyUpdate()}>
        {t('pwa.reload')}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setHidden(true)}>
        {t('pwa.later')}
      </Button>
    </div>
  );
}

export function RouteError({ error, reset }: { error: unknown; reset?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="panel max-w-md p-5">
        <div className="mb-2 flex items-center gap-2 text-danger">
          <Icon name="circle-alert" size={18} />
          <span className="font-semibold">{t('errors.unexpected')}</span>
        </div>
        <details className="mb-3 text-[0.85em] text-muted">
          <summary>{t('errors.details')}</summary>
          <pre className="mt-1 overflow-auto whitespace-pre-wrap">{error instanceof Error ? `${error.name}: ${error.message}` : String(error)}</pre>
        </details>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => (reset ? reset() : window.location.reload())}>
            {t('errors.reload')}
          </Button>
          <Link to="/" className="btn">
            {t('errors.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotFound({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <div className="font-display text-[2em]">{t('errors.notFound')}</div>
        {children}
        <Link to="/" className="btn btn-primary mt-3">
          {t('errors.goHome')}
        </Link>
      </div>
    </div>
  );
}
