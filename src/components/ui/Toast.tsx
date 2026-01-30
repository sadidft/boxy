/**
 * Boxy Toast Notification Component
 */

import { useApp } from '@/store/AppContext';
import { Check, X, AlertCircle, AlertTriangle, Info } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import type { Toast as ToastType } from '@/types';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastType;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const icons = {
    success: <Check size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
    undo: <Check size={18} />,
  };

  const colors = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    undo: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm',
        'animate-in slide-in-from-left-5 fade-in duration-200',
        colors[toast.type]
      )}
    >
      <span className="flex-shrink-0">{icons[toast.type]}</span>
      
      <span className="text-sm font-medium">{toast.message}</span>
      
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="ml-2 text-sm font-semibold hover:underline"
        >
          {toast.action.label}
        </button>
      )}
      
      <button
        onClick={onDismiss}
        className="ml-2 p-0.5 rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
