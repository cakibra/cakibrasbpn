import { useRef, useState } from 'react';
import type { ImportPayload } from '../types';
import { Modal } from './ui/Modal';

interface ImportModalProps { open: boolean; onClose: () => void; onSubmit: (payload: ImportPayload) => void; }

export function ImportModal({ open, onClose, onSubmit }: ImportModalProps): JSX.Element {
  const [mode, setMode] = useState<ImportPayload['mode']>('clipboard');
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Импорт конфигов" wide>
      <div className="segmented-control">
        {(['clipboard', 'link', 'file', 'manual'] as Array<ImportPayload['mode']>).map((item) => (
          <button key={item} type="button" className={`segmented-control__item ${mode === item ? 'is-active' : ''}`} onClick={() => setMode(item)}>{item}</button>
        ))}
      </div>
      <div className="form-grid">
        {(mode === 'clipboard' || mode === 'link' || mode === 'manual') && (
          <label className="field field--full">
            <span>{mode === 'link' ? 'Ссылка' : 'Текст / конфиг / subscription payload'}</span>
            <textarea rows={12} value={text} onChange={(event) => setText(event.target.value)} placeholder="vless://... / vmess://... / base64 / json / plain list" />
          </label>
        )}
        {mode === 'file' && (
          <div className="field field--full">
            <span>Выберите файл</span>
            <input ref={inputRef} type="file" accept=".txt,.json,.conf,.log" onChange={async (event) => {
              const file = event.target.files?.[0]; if (!file) return;
              const content = await file.text();
              onSubmit({ mode: 'file', content, fileName: file.name }); onClose();
              if (inputRef.current) inputRef.current.value = '';
            }} />
          </div>
        )}
      </div>
      {mode !== 'file' && (
        <div className="modal__footer">
          <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
          <button type="button" className="primary-button" onClick={() => { onSubmit({ mode, content: text }); setText(''); onClose(); }} disabled={!text.trim()}>Импортировать</button>
        </div>
      )}
    </Modal>
  );
}
