import { lazy, Suspense, type ComponentType, type JSX } from 'react';
import { createRootRoute, createRoute, createRouter, redirect, Outlet } from '@tanstack/react-router';
import { AppShell, NotFound, RouteError } from '@/App';
import { BoxPage } from '@/pages/BoxPage';
import { HomePage } from '@/pages/HomePage';
import { SETTINGS_SECTIONS, type SettingsSection } from '@/pages/settings-sections';
import { useSettings } from '@/app/settings-store';
import { getDB } from '@/data/db';
import { Spinner } from '@/components/ui/primitives';

/** Secondary pages load on demand so the first paint of a Box stays small. */
function lazyPage<P extends object>(load: () => Promise<ComponentType<P>>): (props: P) => JSX.Element {
  const Page = lazy(() => load().then((component) => ({ default: component })));
  return function LazyPage(props: P) {
    return (
      <Suspense
        fallback={
          <div className="flex h-full min-h-40 items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <Page {...props} />
      </Suspense>
    );
  };
}
const SettingsPage = lazyPage<{ section: SettingsSection }>(() => import('@/pages/SettingsPage').then((m) => m.SettingsPage));
const SearchPage = lazyPage<{ initialQuery: string }>(() => import('@/pages/SearchPage').then((m) => m.SearchPage));
const TrashPage = lazyPage<object>(() => import('@/pages/TrashPage').then((m) => m.TrashPage));
const OnboardingPage = lazyPage<object>(() => import('@/pages/OnboardingPage').then((m) => m.OnboardingPage));
const HandoffPage = lazyPage<object>(() => import('@/pages/HandoffPage').then((m) => m.HandoffPage));
const ImportPage = lazyPage<object>(() => import('@/pages/ImportPage').then((m) => m.ImportPage));

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
});

/** "/" sends the user to the last Box, or to onboarding when there is no data yet. */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const state = useSettings.getState();
    if (!state.ready) await state.load();
    const { settings } = useSettings.getState();
    const db = getDB();
    const boxCount = await db.boxes.count();
    if (boxCount === 0 && !settings.onboardingDone) throw redirect({ to: '/onboarding' });
    if (settings.lastBoxId && (await db.boxes.get(settings.lastBoxId))) throw redirect({ to: '/b/$boxId', params: { boxId: settings.lastBoxId } });
    const first = await db.boxes.orderBy('order').first();
    if (first && !first.archived) throw redirect({ to: '/b/$boxId', params: { boxId: first.id } });
  },
  component: HomePage,
});

const boxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/b/$boxId',
  component: () => <Outlet />,
});
const boxIndexRoute = createRoute({
  getParentRoute: () => boxRoute,
  path: '/',
  component: function BoxIndex() {
    const { boxId } = boxRoute.useParams();
    return <BoxPage boxId={boxId} />;
  },
});
const tabRoute = createRoute({
  getParentRoute: () => boxRoute,
  path: '/t/$tabId',
  component: () => <Outlet />,
});
const tabIndexRoute = createRoute({
  getParentRoute: () => tabRoute,
  path: '/',
  component: function TabIndex() {
    const { boxId, tabId } = tabRoute.useParams();
    return <BoxPage boxId={boxId} tabId={tabId} />;
  },
});
const cardRoute = createRoute({
  getParentRoute: () => tabRoute,
  path: '/c/$cardId',
  component: function CardView() {
    const { boxId, tabId, cardId } = cardRoute.useParams();
    return <BoxPage boxId={boxId} tabId={tabId} cardId={cardId} />;
  },
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  validateSearch: (s: Record<string, unknown>): { q: string } => ({ q: typeof s.q === 'string' ? s.q : '' }),
  component: function Search() {
    const { q } = searchRoute.useSearch();
    return <SearchPage initialQuery={q} />;
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/$section',
  component: function Settings() {
    const { section } = settingsRoute.useParams();
    return <SettingsPage section={(SETTINGS_SECTIONS as readonly string[]).includes(section) ? (section as SettingsSection) : 'appearance'} />;
  },
});
const settingsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: () => {
    throw redirect({ to: '/settings/$section', params: { section: 'appearance' } });
  },
});

const trashRoute = createRoute({ getParentRoute: () => rootRoute, path: '/trash', component: TrashPage });
const onboardingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/onboarding', component: OnboardingPage });
const handoffRoute = createRoute({ getParentRoute: () => rootRoute, path: '/import/handoff', component: HandoffPage });
const importRoute = createRoute({ getParentRoute: () => rootRoute, path: '/import', component: ImportPage });
const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const routeTree = rootRoute.addChildren([indexRoute, boxRoute.addChildren([boxIndexRoute, tabRoute.addChildren([tabIndexRoute, cardRoute])]), searchRoute, settingsRoute, settingsIndexRoute, trashRoute, onboardingRoute, handoffRoute, importRoute, shareRoute]);

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
