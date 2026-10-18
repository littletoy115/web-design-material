import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/cn';

type ToastVariant = 'default' | 'success' | 'error';

interface ToastItem {
  id: number;
  title?: string;
  message: string;
  variant: ToastVariant;
}

interface ToastOptions {
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
};

const iconColors: Record<ToastVariant, string> = {
  default: 'text-primary',
  success: 'text-success',
  error: 'text-destructive',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = ++idRef.current;
      const variant = options.variant ?? 'default';
      setToasts((prev) => [...prev, { id, message, title: options.title, variant }]);
      const duration = options.duration ?? 4000;
      if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, options) => toast(message, { ...options, variant: 'success' }),
      error: (message, options) => toast(message, { ...options, variant: 'error' }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg animate-toast-in"
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', iconColors[t.variant])} />
              <div className="flex-1">
                {t.title && <p className="text-sm font-semibold text-card-foreground">{t.title}</p>}
                <p className="text-sm text-muted-foreground">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
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
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
