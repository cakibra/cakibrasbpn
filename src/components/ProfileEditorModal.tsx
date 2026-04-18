import { useEffect, useMemo, useState } from 'react';
import type { ConnectionProfile, EditorSubmitPayload, ProfileDetails, ProtocolType, SourceType } from '../types';
import { createId, detailsToPrettyJson, nowIso } from '../lib/utils';
import { validateProfile } from '../services/profileAdapters';
import { Modal } from './ui/Modal';

interface ProfileEditorModalProps {
  open: boolean;
  profile?: ConnectionProfile | null;
  onClose: () => void;
  onSubmit: (payload: EditorSubmitPayload) => void;
}

const protocolDefaults: Record<ProtocolType, ProfileDetails> = {
  vless: { uuid: '', transportType: 'tcp', tlsEnabled: true, tlsServerName: '' },
  vmess: { uuid: '', security: 'auto', transportType: 'tcp', tlsEnabled: true, tlsServerName: '' },
  trojan: { password: '', transportType: 'tcp', tlsEnabled: true, tlsServerName: '' },
  shadowsocks: { method: 'aes-128-gcm', password: '' },
  socks: { version: '5', username: '', password: '' },
  hysteria2: { password: '', tlsEnabled: true, tlsServerName: '' },
  custom: { rawConfigJson: '{\n  "outbounds": []\n}' }
};

function createEmptyProfile(): ConnectionProfile {
  const now = nowIso();
  return {
    id: createId('manual'),
    name: '',
    protocol: 'vless',
    server: '',
    port: 443,
    sourceType: 'local',
    sourceLabel: 'Local',
    favorite: false,
    latencyMs: null,
    statusView: { state: 'unknown' },
    details: protocolDefaults.vless,
    createdAt: now,
    updatedAt: now
  };
}

export function ProfileEditorModal({ open, profile, onClose, onSubmit }: ProfileEditorModalProps): JSX.Element {
  const [draft, setDraft] = useState<ConnectionProfile>(createEmptyProfile());
  const [detailsJson, setDetailsJson] = useState(detailsToPrettyJson(protocolDefaults.vless));
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const current = profile ?? createEmptyProfile();
    setDraft(current);
    setDetailsJson(detailsToPrettyJson(current.details));
    setErrors([]);
  }, [profile, open]);

  const submitMode = useMemo<EditorSubmitPayload['mode']>(() => (profile ? 'update' : 'create'), [profile]);

  const handleProtocolChange = (protocol: ProtocolType) => {
    const nextDetails = protocolDefaults[protocol];
    setDraft((prev) => ({ ...prev, protocol, details: nextDetails, port: protocol === 'socks' ? 1080 : 443, updatedAt: nowIso() }));
    setDetailsJson(detailsToPrettyJson(nextDetails));
  };

  const handleSave = () => {
    let parsedDetails: ProfileDetails;
    try { parsedDetails = JSON.parse(detailsJson) as ProfileDetails; }
    catch { setErrors(['Поле details должно быть валидным JSON']); return; }

    const sourceType: SourceType = 'local';
    const candidate: ConnectionProfile = { ...draft, sourceType, sourceLabel: 'Local', details: parsedDetails, updatedAt: nowIso() };
    const validationErrors = validateProfile(candidate);
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
    onSubmit({ mode: submitMode, profile: candidate });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={profile ? 'Редактирование профиля' : 'Новый профиль'} wide>
      <div className="form-grid">
        <label className="field"><span>Название</span><input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Premium NL • Vision" /></label>
        <label className="field"><span>Протокол</span><select value={draft.protocol} onChange={(event) => handleProtocolChange(event.target.value as ProtocolType)}><option value="vless">VLESS</option><option value="vmess">VMess</option><option value="trojan">Trojan</option><option value="shadowsocks">Shadowsocks</option><option value="socks">SOCKS</option><option value="hysteria2">Hysteria2</option><option value="custom">Custom</option></select></label>
        <label className="field"><span>Сервер</span><input value={draft.server} onChange={(event) => setDraft((prev) => ({ ...prev, server: event.target.value }))} placeholder="example.com" /></label>
        <label className="field"><span>Порт</span><input type="number" min={1} max={65535} value={draft.port} onChange={(event) => setDraft((prev) => ({ ...prev, port: Number(event.target.value) }))} /></label>
        <label className="field field--full"><span>Details JSON</span><textarea rows={16} value={detailsJson} onChange={(event) => setDetailsJson(event.target.value)} /></label>
      </div>

      {errors.length > 0 && <div className="error-block">{errors.map((error) => <div key={error}>{error}</div>)}</div>}

      <div className="modal__footer">
        <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
        <button type="button" className="primary-button" onClick={handleSave}>Сохранить</button>
      </div>
    </Modal>
  );
}
