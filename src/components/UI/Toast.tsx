import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  const { id, message, type } = toast;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300',
    error: 'border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300',
    warning: 'border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300',
    info: 'border-blue-500/20 bg-blue-50/90 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-in ${borderColors[type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-grow text-xs font-medium leading-relaxed">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
