import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import './Modal.css';

// Модальное окно: затемнение фона, закрытие по Esc и клику вне окна
export default function Modal({ open, onClose, title, actions, width = 714, children, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const on = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', on);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', on); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${className}`} style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        {(title || actions) && (
          <div className="modal-head">
            {title && <h2>{title}</h2>}
            <div className="row">
              {actions}
              <button type="button" className="modal-x" onClick={onClose} disabled={!onClose} aria-label="Закрыть"><Icon name="x" size={20} /></button>
            </div>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
