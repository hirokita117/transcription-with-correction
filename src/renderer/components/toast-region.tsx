import { useEffect } from 'react';
import type { UIToast } from '../../shared/types';

interface ToastRegionProps {
  toasts: UIToast[];
  onDismiss: (id: string) => void;
}

const TOAST_STYLES: Record<UIToast['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

export function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  useEffect(() => {
    if (toasts.length === 0) return undefined;

    const timers = toasts.map((toast) => window.setTimeout(() => onDismiss(toast.id), 3200));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDismiss, toasts]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg ${TOAST_STYLES[toast.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              className="text-xs opacity-60 transition hover:opacity-100"
              onClick={() => onDismiss(toast.id)}
            >
              閉じる
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
