import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { ToastMessage } from '../../types';
import { createId } from '../../lib/utils';

type ToastContextValue = { push: (payload: Omit<ToastMessage, 'id'>) => void; };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren): JSX.Element {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const push = useCallback((payload: Omit<ToastMessage, 'id'>) => {
    const item: ToastMessage = { id: createId('toast'), ...payload };
    setMessages((prev) => [...prev, item]);
    window.setTimeout(() => setMessages((prev) => prev.filter((entry) => entry.id !== item.id)), 3200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div key={message.id} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.18 }} className={`toast toast--${message.kind ?? 'info'}`}>
              <div className="toast__icon">
                {message.kind === 'success' && <CheckCircle2 size={18} />}
                {message.kind === 'error' && <XCircle size={18} />}
                {(message.kind === 'info' || !message.kind) && <Info size={18} />}
              </div>
              <div>
                <div className="toast__title">{message.title}</div>
                {message.description && <div className="toast__description">{message.description}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
