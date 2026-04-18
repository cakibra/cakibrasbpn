import {
  BookOpen,
  Bot,
  CircleDashed,
  Gamepad2,
  Gauge,
  Globe,
  Instagram,
  MessageCircle,
  Play,
  Route,
  SignalHigh,
  Sparkles,
} from 'lucide-react';
import type { AppRouteRule, AppSettings } from '../types';

interface RouterPanelProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

const iconMap = {
  youtube: Play,
  chatgpt: Bot,
  instagram: Instagram,
  facebook: MessageCircle,
  x: Sparkles,
  discord: Gamepad2,
  signal: SignalHigh,
  wikipedia: BookOpen,
  speedtest: Gauge,
} as const;

function withRule(rules: AppRouteRule[], ruleId: string, patch: Partial<AppRouteRule>): AppRouteRule[] {
  return rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule));
}

export function RouterPanel({ settings, onChange }: RouterPanelProps): JSX.Element {
  return (
    <section className="router-panel panel-surface">
      <div className="router-panel__head">
        <div>
          <h1>Маршрутизатор</h1>
          <p>Включай VPN только там, где это нужно: YouTube, ChatGPT и сервисы с ограничениями доступа.</p>
        </div>
        <div className="router-mode-switch">
          <button
            type="button"
            className={`router-mode-switch__item ${settings.routingMode === 'split' ? 'is-active' : ''}`}
            onClick={() => onChange({ routingMode: 'split' })}
          >
            Выборочно
          </button>
          <button
            type="button"
            className={`router-mode-switch__item ${settings.routingMode === 'global' ? 'is-active' : ''}`}
            onClick={() => onChange({ routingMode: 'global' })}
          >
            Всё через VPN
          </button>
        </div>
      </div>

      <div className="router-info-card">
        <div className="router-info-card__icon"><Route size={18} /></div>
        <div>
          <strong>Системный маршрутизатор доменов</strong>
          <p>
            Когда выбран режим «Выборочно», трафик из списка ниже идёт через VPN, а остальное открывается напрямую.
            TUN оставлен как beta‑переключатель в настройках, основной рабочий режим — через системный proxy.
          </p>
        </div>
      </div>

      <div className="router-rule-list">
        {settings.routeRules.map((rule) => {
          const Icon = iconMap[rule.iconKey as keyof typeof iconMap] ?? Globe;
          return (
            <article key={rule.id} className={`router-rule ${rule.enabled ? 'is-enabled' : ''}`}>
              <div className="router-rule__left">
                <div className="router-rule__icon"><Icon size={20} /></div>
                <div>
                  <div className="router-rule__title-row">
                    <h3>{rule.label}</h3>
                    {rule.blockedInRu && <span className="router-badge">ограничен / блокируется в РФ</span>}
                  </div>
                  <p>{rule.description ?? rule.domains.join(', ')}</p>
                </div>
              </div>
              <div className="router-rule__right">
                <button
                  type="button"
                  className={`route-toggle ${rule.enabled ? 'is-on' : ''}`}
                  aria-pressed={rule.enabled}
                  onClick={() => onChange({ routeRules: withRule(settings.routeRules, rule.id, { enabled: !rule.enabled }) })}
                  title={rule.enabled ? 'VPN включён для этого сервиса' : 'VPN выключен для этого сервиса'}
                >
                  <span className="route-toggle__knob" />
                </button>
                <select
                  className="router-rule__select"
                  value={rule.mode}
                  onChange={(event) => onChange({ routeRules: withRule(settings.routeRules, rule.id, { mode: event.target.value as AppRouteRule['mode'] }) })}
                >
                  <option value="proxy">через VPN</option>
                  <option value="direct">напрямую</option>
                </select>
              </div>
            </article>
          );
        })}
      </div>

      <div className="router-custom-card">
        <div className="router-custom-card__head">
          <div className="router-custom-card__icon"><CircleDashed size={18} /></div>
          <div>
            <strong>Свой список доменов</strong>
            <p>Редактируй домены для выбранного правила вручную, если нужен свой набор сервисов.</p>
          </div>
        </div>
        <div className="router-custom-grid">
          {settings.routeRules.map((rule) => (
            <label key={`${rule.id}-domains`} className="field field--full">
              <span>{rule.label}</span>
              <textarea
                value={rule.domains.join('\n')}
                onChange={(event) => onChange({
                  routeRules: withRule(settings.routeRules, rule.id, {
                    domains: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
                  }),
                })}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
