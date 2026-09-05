import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { registerSW } from 'virtual:pwa-register';
import '@/styles/app.css';
import { initI18n, detectLocale } from '@/i18n';
import { useSettings } from '@/app/settings-store';
import { initPwaListeners, usePwa } from '@/app/pwa';
import { maybeDailySnapshot } from '@/app/backup';
import { purgeExpired } from '@/data/repo/trash';
import { flushProjections } from '@/data/store';
import { TooltipProvider } from '@/components/ui/primitives';
import { router } from '@/router';

initI18n(detectLocale('auto'));
initPwaListeners();

async function boot(): Promise<void> {
  await useSettings.getState().load();
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <TooltipProvider delayDuration={400} skipDelayDuration={200}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </StrictMode>,
  );

  // Housekeeping after first paint.
  setTimeout(() => {
    void purgeExpired();
    void maybeDailySnapshot();
  }, 4000);

  window.addEventListener('pagehide', () => void flushProjections());

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        usePwa.getState().setUpdate(async () => {
          await flushProjections();
          await updateSW(true);
        });
      },
      onOfflineReady() {
        usePwa.getState().setOfflineReady();
      },
    });
  }
}

void boot();
