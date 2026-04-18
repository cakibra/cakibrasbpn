import { motion } from 'framer-motion';
import { Globe, Power, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import type { ConnectionProfile, RuntimeSnapshot } from '../types';
import { flagEmoji, formatDurationFromIso, formatLatency, protocolLabel } from '../lib/utils';

interface ConnectionHeroProps {
  runtime: RuntimeSnapshot;
  activeProfile?: ConnectionProfile | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onQuickTest: () => void;
  connectDisabled: boolean;
  disconnectDisabled: boolean;
}

export function ConnectionHero({
  runtime, activeProfile, onConnect, onDisconnect, onQuickTest, connectDisabled, disconnectDisabled,
}: ConnectionHeroProps): JSX.Element {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!runtime.connectedAt) {
      setElapsed('00:00');
      return;
    }
    setElapsed(formatDurationFromIso(runtime.connectedAt));
    const timer = window.setInterval(() => setElapsed(formatDurationFromIso(runtime.connectedAt)), 1000);
    return () => window.clearInterval(timer);
  }, [runtime.connectedAt]);

  const currentProfile = activeProfile ?? null;
  const isConnected = runtime.status === 'connected';
  const isBusy = runtime.status === 'connecting' || runtime.status === 'disconnecting';
  const statusLabel =
    runtime.status === 'connected' ? 'ПОДКЛЮЧЁН' :
    runtime.status === 'connecting' ? 'ПОДКЛЮЧЕНИЕ' :
    runtime.status === 'error' ? 'ОШИБКА' : 'ГОТОВ';

  return (
    <section className="connection-stage panel-surface">
      <div className="connection-stage__hero-bg" />
      <div className="connection-stage__canvas">
        <motion.div className={`connection-orb ${isConnected ? 'is-connected' : ''}`} animate={isConnected ? { scale: [1, 1.02, 1] } : { scale: 1 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <motion.div className="connection-orb__ring connection-orb__ring--outer" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="connection-orb__ring connection-orb__ring--middle" animate={{ rotate: -360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
          <div className="connection-orb__core">
            <button
              type="button"
              className={`connection-orb__button ${isConnected ? 'is-connected' : ''}`}
              onClick={isConnected ? onDisconnect : onConnect}
              disabled={isConnected ? disconnectDisabled : connectDisabled}
            >
              <Power size={34} />
            </button>
            <div className="connection-orb__status">{statusLabel}</div>
            <div className="connection-orb__time">{elapsed}</div>
          </div>
        </motion.div>
      </div>

      <div className="connection-stage__footer">
        <img src={logo} alt="CAKIBRA" className="connection-stage__logo" />
        <div className="connection-stage__profile-name">{currentProfile?.name ?? 'Выбери сервер'}</div>
        <div className="connection-stage__profile-meta">
          <span><Globe size={14} /> {currentProfile ? `${flagEmoji(currentProfile.countryCode)} ${currentProfile.countryName ?? 'Unknown'}` : 'Ожидание выбора'}</span>
          <span><ShieldCheck size={14} /> {currentProfile ? protocolLabel(currentProfile.protocol) : 'VLESS / VMess / Trojan'}</span>
        </div>
        <div className="connection-stage__profile-host">{currentProfile ? `${currentProfile.server}:${currentProfile.port}` : 'Подключение начнётся после выбора профиля'}</div>
        <div className="connection-stage__actions">
          <button type="button" className="primary-button connection-stage__test-button" onClick={onQuickTest} disabled={!currentProfile || isBusy}>
            <RefreshCcw size={16} /> Тест пинга {currentProfile?.latencyMs != null ? `• ${formatLatency(currentProfile.latencyMs)}` : ''}
          </button>
        </div>
        <div className="mode-switch" aria-label="Connection mode">
          <button type="button" className="mode-switch__item is-active">Proxy</button>
          <button type="button" className="mode-switch__item" disabled title="TUN пока не проверен и оставлен как beta‑режим">TUN</button>
        </div>
        {runtime.lastError && <div className="connection-stage__error">{runtime.lastError}</div>}
      </div>
    </section>
  );
}
