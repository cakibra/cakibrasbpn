import type { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps): JSX.Element {
  return (
    <div className="stack-list settings-stack">
      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <h3>Общие настройки</h3>
            <p>Тема, системный proxy, автозапуск и параметры подключения.</p>
          </div>
        </div>
        <div className="form-grid form-grid--settings">
          <label className="field"><span>Тема</span><select value={settings.theme} onChange={(event) => onChange({ theme: event.target.value as AppSettings['theme'] })}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>
          <label className="field"><span>Язык</span><select value={settings.language} onChange={(event) => onChange({ language: event.target.value as AppSettings['language'] })}><option value="ru">Русский</option><option value="en">English</option></select></label>
          <label className="field"><span>Таймаут теста, мс</span><input type="number" min={500} max={10000} value={settings.pingTimeoutMs} onChange={(event) => onChange({ pingTimeoutMs: Number(event.target.value) })} /></label>
          <label className="field"><span>Интервал автообновления, мин</span><input type="number" min={5} max={720} value={settings.autoUpdateIntervalMinutes} onChange={(event) => onChange({ autoUpdateIntervalMinutes: Number(event.target.value) })} /></label>
          <label className="field"><span>Сортировка по умолчанию</span><select value={settings.defaultSort} onChange={(event) => onChange({ defaultSort: event.target.value as AppSettings['defaultSort'] })}><option value="latency">Пинг</option><option value="name">Имя</option><option value="country">Страна</option><option value="protocol">Протокол</option></select></label>
          <label className="field"><span>Локальный proxy port</span><input type="number" min={1025} max={65535} value={settings.localProxyPort} onChange={(event) => onChange({ localProxyPort: Number(event.target.value) })} /></label>
        </div>
        <div className="toggle-grid">
          <label className="toggle-field"><input type="checkbox" checked={settings.autoUpdateSubscriptions} onChange={(event) => onChange({ autoUpdateSubscriptions: event.target.checked })} /><span>Автообновление подписок</span></label>
          <label className="toggle-field"><input type="checkbox" checked={settings.enableSystemProxy} onChange={(event) => onChange({ enableSystemProxy: event.target.checked })} /><span>Включать системный proxy</span></label>
          <label className="toggle-field"><input type="checkbox" checked={settings.autoReconnect} onChange={(event) => onChange({ autoReconnect: event.target.checked })} /><span>Автопереподключение</span></label>
          <label className="toggle-field"><input type="checkbox" checked={settings.launchOnWindowsStartup} onChange={(event) => onChange({ launchOnWindowsStartup: event.target.checked })} /><span>Запуск вместе с Windows</span></label>
          <label className="toggle-field"><input type="checkbox" checked={settings.tunEnabled} onChange={(event) => onChange({ tunEnabled: event.target.checked })} /><span>TUN beta</span></label>
        </div>
      </div>
    </div>
  );
}
