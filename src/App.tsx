import { useCallback, useEffect, useMemo, useState } from 'react';
import { Import, Plus, RefreshCcw, ScanSearch } from 'lucide-react';
import type {
  AppSettings,
  ConnectionHistoryEntry,
  ConnectionProfile,
  ImportPayload,
  PersistedAppState,
  RuntimeSnapshot,
  SubscriptionSubmitPayload,
  UserFilters,
} from './types';
import {
  compareProfiles,
  defaultPersistedState,
  mergePersistedState,
  normalizeError,
  textFileDownload,
  createId,
  nowIso,
} from './lib/utils';
import { connectProfile, disconnectProfile, loadAppState, quickTest, resolveGeo, saveAppState, setAutostart, testProfiles, downloadSubscription } from './services/bridge';
import { buildSubscriptionEntry, parseSubscriptionPayload } from './services/subscriptionParser';
import { exportProfile, parseProfileText } from './services/profileAdapters';
import { useRuntimePoll } from './hooks/useRuntimePoll';
import { Sidebar } from './components/Sidebar';
import { ConnectionHero } from './components/ConnectionHero';
import { FilterToolbar } from './components/FilterToolbar';
import { ServerList } from './components/ServerList';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { RouterPanel } from './components/RouterPanel';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { ImportModal } from './components/ImportModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ProfileEditorModal } from './components/ProfileEditorModal';
import { SkeletonCard } from './components/ui/SkeletonCard';

type TabId = 'servers' | 'router' | 'settings' | 'logs';

function AppInner(): JSX.Element {
  const { push } = useToast();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>('servers');
  const [persisted, setPersisted] = useState<PersistedAppState>(defaultPersistedState());
  const [runtime, setRuntime] = useState<RuntimeSnapshot>({ status: 'disconnected' });
  const [filters, setFilters] = useState<UserFilters>({ search: '', country: '', protocol: '', subscriptionId: '', favoritesOnly: false, sortBy: 'latency' });
  const [importOpen, setImportOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorProfileId, setEditorProfileId] = useState<string | null>(null);
  const [busySubscriptions, setBusySubscriptions] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useRuntimePoll(
    useCallback((snapshot) => setRuntime(snapshot), []),
    useCallback((message: string) => push({ title: 'Ошибка runtime', description: message, kind: 'error' }), [push]),
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadAppState();
        if (!active) return;
        const merged = mergePersistedState(stored);
        setPersisted(merged);
        setFilters((prev) => ({ ...prev, sortBy: merged.settings.defaultSort }));
      } catch (error) {
        push({ title: 'Не удалось загрузить состояние', description: normalizeError(error), kind: 'error' });
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, [push]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void saveAppState(persisted).catch((error) => push({ title: 'Не удалось сохранить состояние', description: normalizeError(error), kind: 'error' }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [persisted, ready, push]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = persisted.settings.theme;
    const actualTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
    root.dataset.theme = actualTheme;
    root.dataset.sidebar = sidebarCollapsed ? 'collapsed' : 'expanded';
  }, [persisted.settings.theme, sidebarCollapsed]);

  const applyGeoForProfiles = useCallback(async (profiles: ConnectionProfile[]) => {
    const unknownProfiles = profiles.filter((profile) => !profile.countryCode).slice(0, 8);
    for (const profile of unknownProfiles) {
      try {
        const geo = await resolveGeo(profile.server);
        setPersisted((prev) => ({
          ...prev,
          profiles: prev.profiles.map((item) => item.id === profile.id ? { ...item, countryCode: geo.countryCode ?? item.countryCode ?? null, countryName: geo.countryName ?? item.countryName ?? null } : item),
        }));
      } catch {}
    }
  }, []);

  const refreshSubscription = useCallback(async (subscriptionId: string, silent = false) => {
    const subscription = persisted.subscriptions.find((item) => item.id === subscriptionId);
    if (!subscription) return;
    setBusySubscriptions((prev) => ({ ...prev, [subscriptionId]: true }));
    try {
      const response = await downloadSubscription({
        url: subscription.url,
        etag: subscription.etag,
        lastModified: subscription.lastModified,
        timeoutMs: Math.max(3000, persisted.settings.pingTimeoutMs * 2),
      });
      if (response.error) throw new Error(response.error);
      if (response.notModified) {
        setPersisted((prev) => ({
          ...prev,
          subscriptions: prev.subscriptions.map((item) => item.id === subscriptionId ? { ...item, lastUpdatedAt: nowIso(), lastError: undefined, updatedAt: nowIso() } : item),
        }));
        if (!silent) push({ title: 'Подписка не изменилась', description: subscription.name, kind: 'info' });
        return;
      }
      const raw = response.content ?? '';
      const parsedProfiles = parseSubscriptionPayload({ raw, subscription });
      setPersisted((prev) => {
        const cleanedProfiles = prev.profiles.filter((item) => item.subscriptionId !== subscriptionId);
        const nextProfiles = [...cleanedProfiles, ...parsedProfiles];
        const nextSubscriptions = prev.subscriptions.map((item) =>
          item.id === subscriptionId
            ? { ...item, cacheRaw: raw, etag: response.etag ?? undefined, lastModified: response.lastModified ?? undefined, lastUpdatedAt: nowIso(), lastError: undefined, profileIds: parsedProfiles.map((profile) => profile.id), updatedAt: nowIso() }
            : item,
        );
        return { ...prev, profiles: nextProfiles, subscriptions: nextSubscriptions };
      });
      void applyGeoForProfiles(parsedProfiles);
      if (!silent) push({ title: 'Подписка обновлена', description: `${subscription.name} · ${parsedProfiles.length} профилей`, kind: 'success' });
    } catch (error) {
      const message = normalizeError(error);
      setPersisted((prev) => ({ ...prev, subscriptions: prev.subscriptions.map((item) => item.id === subscriptionId ? { ...item, lastError: message, updatedAt: nowIso() } : item) }));
      push({ title: 'Ошибка обновления подписки', description: message, kind: 'error' });
    } finally {
      setBusySubscriptions((prev) => ({ ...prev, [subscriptionId]: false }));
    }
  }, [applyGeoForProfiles, persisted.settings.pingTimeoutMs, persisted.subscriptions, push]);

  const activeProfile = useMemo(() => persisted.profiles.find((profile) => profile.id === runtime.activeProfileId) ?? null, [persisted.profiles, runtime.activeProfileId]);

  const visibleProfiles = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return [...persisted.profiles]
      .filter((profile) => {
        if (filters.country && profile.countryName !== filters.country) return false;
        if (filters.protocol && profile.protocol !== filters.protocol) return false;
        if (filters.subscriptionId === 'local' && profile.sourceType !== 'local') return false;
        if (filters.subscriptionId && filters.subscriptionId !== 'local' && profile.subscriptionId !== filters.subscriptionId) return false;
        if (filters.favoritesOnly && !profile.favorite) return false;
        if (search) {
          const haystack = `${profile.name} ${profile.server} ${profile.countryName ?? ''}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((left, right) => compareProfiles(left, right, filters.sortBy));
  }, [filters, persisted.profiles]);

  const selectedProfile = useMemo(
    () => activeProfile ?? persisted.profiles.find((profile) => profile.id === persisted.lastSelectedProfileId) ?? visibleProfiles[0] ?? null,
    [activeProfile, persisted.profiles, persisted.lastSelectedProfileId, visibleProfiles],
  );

  const countries = useMemo(() => [...new Set(persisted.profiles.map((profile) => profile.countryName).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'ru')), [persisted.profiles]);

  const addHistoryEntry = useCallback((profile: ConnectionProfile, success: boolean) => {
    const entry: ConnectionHistoryEntry = {
      id: createId('history'),
      profileId: profile.id,
      profileName: profile.name,
      protocol: profile.protocol,
      server: `${profile.server}:${profile.port}`,
      connectedAt: nowIso(),
      latencyMs: profile.latencyMs ?? null,
      success,
      sourceLabel: profile.sourceLabel,
    };
    setPersisted((prev) => ({ ...prev, history: [entry, ...prev.history].slice(0, 100) }));
  }, []);

  const handleCreateSubscription = useCallback(async (payload: SubscriptionSubmitPayload) => {
    const subscription = buildSubscriptionEntry(payload);
    setPersisted((prev) => ({ ...prev, subscriptions: [subscription, ...prev.subscriptions] }));
    push({ title: 'Подписка добавлена', description: subscription.name, kind: 'success' });
    await refreshSubscription(subscription.id);
  }, [push, refreshSubscription]);

  const handleImport = useCallback(async (payload: ImportPayload) => {
    try {
      const profiles = parseProfileText(payload.content, { sourceType: 'local' });
      if (profiles.length === 0) throw new Error('Не удалось найти ни одного профиля');
      setPersisted((prev) => ({ ...prev, profiles: [...profiles, ...prev.profiles], lastSelectedProfileId: profiles[0]?.id ?? prev.lastSelectedProfileId }));
      void applyGeoForProfiles(profiles);
      push({ title: 'Импорт завершён', description: `${profiles.length} профилей`, kind: 'success' });
    } catch (error) {
      push({ title: 'Ошибка импорта', description: normalizeError(error), kind: 'error' });
    }
  }, [applyGeoForProfiles, push]);

  const handleToggleFavorite = useCallback((profileId: string) => {
    setPersisted((prev) => ({ ...prev, profiles: prev.profiles.map((profile) => profile.id === profileId ? { ...profile, favorite: !profile.favorite, updatedAt: nowIso() } : profile) }));
  }, []);

  const handleDeleteProfile = useCallback((profileId: string) => {
    setPersisted((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((profile) => profile.id !== profileId),
      lastSelectedProfileId: prev.lastSelectedProfileId === profileId ? prev.profiles.find((item) => item.id !== profileId)?.id : prev.lastSelectedProfileId,
    }));
  }, []);

  const handleEditProfile = useCallback((profileId: string) => { setEditorProfileId(profileId); setEditorOpen(true); }, []);

  const handleEditorSubmit = useCallback((payload: { mode: 'create' | 'update'; profile: ConnectionProfile }) => {
    setPersisted((prev) => payload.mode === 'create'
      ? { ...prev, profiles: [payload.profile, ...prev.profiles], lastSelectedProfileId: payload.profile.id }
      : { ...prev, profiles: prev.profiles.map((profile) => (profile.id === payload.profile.id ? payload.profile : profile)) });
    push({ title: payload.mode === 'create' ? 'Профиль создан' : 'Профиль обновлён', description: payload.profile.name, kind: 'success' });
  }, [push]);

  const handleExport = useCallback((profile: ConnectionProfile) => {
    const content = exportProfile(profile);
    textFileDownload(`${profile.name.replace(/[^\w\-]+/g, '_')}.txt`, content);
    push({ title: 'Профиль экспортирован', description: profile.name, kind: 'success' });
  }, [push]);

  const handleTestAll = useCallback(async () => {
    if (persisted.profiles.length === 0) return;
    setTestingAll(true);
    try {
      const results = await testProfiles(persisted.profiles.map((profile) => ({ id: profile.id, server: profile.server, port: profile.port })), persisted.settings.pingTimeoutMs);
      setPersisted((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) => {
          const result = results.find((entry) => entry.id === profile.id);
          if (!result) return profile;
          return { ...profile, latencyMs: result.online ? result.latencyMs ?? null : null, lastCheckedAt: result.checkedAt, lastSuccessfulTestAt: result.online ? result.checkedAt : profile.lastSuccessfulTestAt, statusView: { state: result.online ? 'online' : 'offline' } };
        }),
      }));
      push({ title: 'Тест завершён', description: `${results.length} профилей`, kind: 'success' });
    } catch (error) {
      push({ title: 'Ошибка теста', description: normalizeError(error), kind: 'error' });
    } finally { setTestingAll(false); }
  }, [persisted.profiles, persisted.settings.pingTimeoutMs, push]);

  const handleQuickTest = useCallback(async () => {
    const profile = selectedProfile ?? persisted.profiles[0];
    if (!profile) return;
    try {
      const result = await quickTest({ id: profile.id, server: profile.server, port: profile.port }, persisted.settings.pingTimeoutMs);
      setPersisted((prev) => ({
        ...prev,
        profiles: prev.profiles.map((item) => item.id === profile.id ? { ...item, latencyMs: result.online ? result.latencyMs ?? null : null, lastCheckedAt: result.checkedAt, lastSuccessfulTestAt: result.online ? result.checkedAt : item.lastSuccessfulTestAt, statusView: { state: result.online ? 'online' : 'offline' } } : item),
      }));
      push({ title: 'Пинг обновлён', description: `${profile.name} · ${result.online ? `${result.latencyMs} ms` : 'offline'}`, kind: result.online ? 'success' : 'info' });
    } catch (error) {
      push({ title: 'Ошибка теста', description: normalizeError(error), kind: 'error' });
    }
  }, [selectedProfile, persisted.profiles, persisted.settings.pingTimeoutMs, push]);

  const handleConnect = useCallback(async (profile?: ConnectionProfile | null) => {
    const target = profile ?? selectedProfile ?? visibleProfiles[0];
    if (!target) { push({ title: 'Нет профиля для подключения', kind: 'info' }); return; }
    try {
      const snapshot = await connectProfile(target, persisted.settings);
      setRuntime(snapshot);
      addHistoryEntry(target, true);
      setPersisted((prev) => ({ ...prev, lastSelectedProfileId: target.id }));
      push({ title: 'Подключение запущено', description: target.name, kind: 'success' });
    } catch (error) {
      addHistoryEntry(target, false);
      push({ title: 'Не удалось подключиться', description: normalizeError(error), kind: 'error' });
    }
  }, [selectedProfile, visibleProfiles, push, persisted.settings, addHistoryEntry]);

  const handleDisconnect = useCallback(async () => {
    try {
      const snapshot = await disconnectProfile();
      setRuntime(snapshot);
      push({ title: 'Подключение остановлено', kind: 'success' });
    } catch (error) {
      push({ title: 'Не удалось отключиться', description: normalizeError(error), kind: 'error' });
    }
  }, [push]);

  const handleSettingsChange = useCallback((patch: Partial<AppSettings>) => {
    setPersisted((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    if (patch.launchOnWindowsStartup != null) {
      void setAutostart(Boolean(patch.launchOnWindowsStartup))
        .then(() => push({ title: patch.launchOnWindowsStartup ? 'Автозапуск включён' : 'Автозапуск выключен', kind: 'success' }))
        .catch((error) => push({ title: 'Не удалось изменить автозапуск', description: normalizeError(error), kind: 'error' }));
    }
  }, [push]);

  const editorProfile = editorProfileId ? persisted.profiles.find((profile) => profile.id === editorProfileId) ?? null : null;

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activeTab={tab}
        onChange={setTab}
        onQuickAdd={() => setImportOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <main className="main-content main-content--split">
        {tab === 'servers' && (
          <div className="workspace-grid">
            <section className="servers-pane panel-surface">
              <div className="page-head">
                <div>
                  <h1>Серверы</h1>
                </div>
                <div className="page-head__actions">
                  <button type="button" className="icon-button" onClick={() => void handleTestAll()} disabled={testingAll}><ScanSearch size={17} /></button>
                  <button type="button" className="icon-button" onClick={() => persisted.subscriptions.forEach((subscription) => void refreshSubscription(subscription.id, true))}><RefreshCcw size={17} /></button>
                </div>
              </div>

              <FilterToolbar filters={filters} countries={countries} subscriptions={persisted.subscriptions} onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))} />

              <div className="servers-toolbar">
                <button type="button" className="secondary-button" onClick={() => setImportOpen(true)}><Import size={16} /> Импорт</button>
                <button type="button" className="secondary-button" onClick={() => setSubscriptionOpen(true)}>URL</button>
                <button type="button" className="secondary-button" onClick={() => { setEditorProfileId(null); setEditorOpen(true); }}><Plus size={16} /> Профиль</button>
              </div>

              {runtime.lastError && <div className="inline-error">{runtime.lastError}</div>}

              {!ready ? (
                <div className="servers-skeletons"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
              ) : (
                <ServerList
                  profiles={visibleProfiles}
                  subscriptions={persisted.subscriptions.map((subscription) => busySubscriptions[subscription.id] ? { ...subscription, lastError: 'Loading...' } : subscription)}
                  runtime={runtime}
                  selectedProfileId={selectedProfile?.id}
                  onSelect={(profileId) => setPersisted((prev) => ({ ...prev, lastSelectedProfileId: profileId }))}
                  onConnect={(profile) => void handleConnect(profile)}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteProfile}
                  onExport={handleExport}
                  onCreateProfile={() => { setEditorProfileId(null); setEditorOpen(true); }}
                />
              )}
            </section>

            <ConnectionHero
              runtime={runtime}
              activeProfile={selectedProfile}
              onConnect={() => void handleConnect()}
              onDisconnect={() => void handleDisconnect()}
              onQuickTest={() => void handleQuickTest()}
              connectDisabled={runtime.status === 'connecting' || runtime.status === 'connected'}
              disconnectDisabled={runtime.status === 'disconnecting' || runtime.status === 'disconnected'}
            />
          </div>
        )}

        {tab === 'router' && <RouterPanel settings={persisted.settings} onChange={handleSettingsChange} />}
        {tab === 'settings' && <SettingsPanel settings={persisted.settings} onChange={handleSettingsChange} />}
        {tab === 'logs' && <HistoryPanel history={persisted.history} />}
      </main>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onSubmit={(payload) => void handleImport(payload)} />
      <SubscriptionModal open={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} onSubmit={(payload) => { setSubscriptionOpen(false); void handleCreateSubscription(payload); }} />
      <ProfileEditorModal open={editorOpen} profile={editorProfile} onClose={() => { setEditorOpen(false); setEditorProfileId(null); }} onSubmit={handleEditorSubmit} />
    </div>
  );
}

export default function App(): JSX.Element {
  return <ToastProvider><AppInner /></ToastProvider>;
}
