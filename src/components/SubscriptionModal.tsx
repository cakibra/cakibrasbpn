import { useMemo, useState } from 'react';
import type { SubscriptionSubmitPayload } from '../types';
import { Modal } from './ui/Modal';

interface SubscriptionModalProps { open: boolean; onClose: () => void; onSubmit: (payload: SubscriptionSubmitPayload) => void; }

export function SubscriptionModal({ open, onClose, onSubmit }: SubscriptionModalProps): JSX.Element {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const disabled = useMemo(() => !name.trim() || !url.trim(), [name, url]);
  return (
    <Modal open={open} onClose={onClose} title="Новая подписка">
      <div className="form-grid">
        <label className="field"><span>Название</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Main subscription" /></label>
        <label className="field"><span>Subscription URL</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label>
        <label className="toggle-field"><input type="checkbox" checked={autoUpdate} onChange={(event) => setAutoUpdate(event.target.checked)} /><span>Автообновление</span></label>
      </div>
      <div className="modal__footer">
        <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
        <button type="button" className="primary-button" disabled={disabled} onClick={() => { onSubmit({ name, url, autoUpdate }); setName(''); setUrl(''); setAutoUpdate(true); }}>Сохранить</button>
      </div>
    </Modal>
  );
}
