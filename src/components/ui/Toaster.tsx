import { useTranslation } from 'react-i18next';
import { useUI } from '@/app/ui-store';
import { Icon } from './Icon';

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  const { t } = useTranslation();
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-[calc(var(--shell-quick)+12px+env(safe-area-inset-bottom))] left-1/2 z-[70] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 md:bottom-[calc(var(--shell-quick)+12px)]">
      {toasts.map((toast) => (
        <div key={toast.id} role="status" className="panel pointer-events-auto flex items-center gap-2 px-3 py-2 text-[0.95em] slide-up">
          <Icon name={toast.kind === 'error' ? 'circle-alert' : toast.kind === 'success' ? 'circle-check' : 'info'} size={16} className={toast.kind === 'error' ? 'text-danger' : 'text-accent'} />
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action ? (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={() => {
                toast.action?.onClick();
                dismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
          <button type="button" className="icon-btn" style={{ width: 24, height: 24 }} aria-label={t('common.close')} onClick={() => dismiss(toast.id)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
