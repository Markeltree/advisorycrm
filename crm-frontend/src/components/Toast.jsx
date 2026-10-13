import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils.js';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((items) => items.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, tone = 'info') => {
      const id = nextId.current++;
      setToasts((items) => [...items, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  const toneConfig = {
    success: {
      icon: CheckCircle2,
      class: 'border-emerald-200 bg-white text-emerald-950 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-200',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
    danger: {
      icon: AlertCircle,
      class: 'border-rose-200 bg-white text-rose-950 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-200',
      iconClass: 'text-rose-600 dark:text-rose-400',
    },
    info: {
      icon: Info,
      class: 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
      iconClass: 'text-zinc-600 dark:text-zinc-400',
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const config = toneConfig[t.tone] || toneConfig.info;
          const Icon = config.icon;
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200',
                config.class
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn('w-4 h-4 shrink-0', config.iconClass)} />
                <span className="text-xs font-medium">{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-md transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
