import { AnimatePresence, motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, wide }: ModalProps): JSX.Element {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div className={`modal ${wide ? 'modal--wide' : ''}`} initial={{ opacity: 0, scale: 0.97, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 18 }} transition={{ duration: 0.18 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h3>{title}</h3>
              <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
