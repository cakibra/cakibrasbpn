import type { LanguageCode } from './types';
type Dictionary = Record<string, string>;
const ru: Dictionary = {
  appTitle: 'CAKIBRA SBP',
  appSubtitle: 'Премиальный менеджер конфигов и подключений',
  tabServers: 'Серверы',
  tabSubscriptions: 'Подписки',
  tabHistory: 'История',
  tabSettings: 'Настройки'
};
const en: Dictionary = {
  appTitle: 'CAKIBRA SBP',
  appSubtitle: 'Premium config and connection manager',
  tabServers: 'Servers',
  tabSubscriptions: 'Subscriptions',
  tabHistory: 'History',
  tabSettings: 'Settings'
};
const dictionaryMap: Record<LanguageCode, Dictionary> = { ru, en };
export function t(language: LanguageCode, key: string): string {
  return dictionaryMap[language][key] ?? ru[key] ?? key;
}
