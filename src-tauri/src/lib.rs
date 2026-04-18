
mod connection;
mod errors;
mod geo;
mod models;
mod ping;
mod singbox;
mod storage;
mod subscription_fetcher;
mod windows_proxy;

use connection::ConnectionManager;
use models::{ConnectRequest, GeoLookupResult, PingResult, PingTarget, RuntimeSnapshot, SubscriptionFetchResponse, SubscriptionRequest};
use serde_json::Value;
use storage::{load_state, save_state, AppPaths, FileLogger};
use tauri::{AppHandle, Manager, State};

struct PersistedState {
    paths: AppPaths,
}

#[tauri::command]
fn load_app_state(state: State<'_, PersistedState>) -> Result<Option<Value>, String> {
    load_state(&state.paths).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_app_state(ctx: State<'_, PersistedState>, state: Value) -> Result<(), String> {
    save_state(&ctx.paths, &state).map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_subscription(request: SubscriptionRequest) -> Result<SubscriptionFetchResponse, String> {
    subscription_fetcher::download_subscription(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn test_profiles(targets: Vec<PingTarget>, timeout_ms: u64) -> Result<Vec<PingResult>, String> {
    Ok(ping::test_targets(targets, timeout_ms).await)
}

#[tauri::command]
async fn quick_test(target: PingTarget, timeout_ms: u64) -> Result<PingResult, String> {
    Ok(ping::quick_test(target, timeout_ms).await)
}

#[tauri::command]
async fn resolve_geo(state: State<'_, PersistedState>, server: String) -> Result<GeoLookupResult, String> {
    geo::resolve_geo(&state.paths, &server)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn connect_profile(manager: State<'_, ConnectionManager>, request: ConnectRequest) -> Result<RuntimeSnapshot, String> {
    manager.connect_internal(request).map_err(|e| e.to_string())
}

#[tauri::command]
fn disconnect_profile(manager: State<'_, ConnectionManager>) -> Result<RuntimeSnapshot, String> {
    manager.disconnect().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_connection_snapshot(manager: State<'_, ConnectionManager>) -> Result<RuntimeSnapshot, String> {
    Ok(manager.snapshot())
}

#[tauri::command]
fn set_autostart(_app: AppHandle, enabled: bool) -> Result<bool, String> {
    let main_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    windows_proxy::set_autostart(&main_exe, enabled)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            let paths = AppPaths::resolve(&app_handle).expect("failed to resolve app paths");
            let logger = FileLogger::new(&paths).expect("failed to initialize logger");
            logger.log("Application started");

            let persisted = PersistedState { paths: paths.clone() };
            let connection_manager = ConnectionManager::new(paths, logger.clone());
            connection_manager.start_monitor();

            app.manage(persisted);
            app.manage(connection_manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_app_state,
            save_app_state,
            download_subscription,
            test_profiles,
            quick_test,
            resolve_geo,
            connect_profile,
            disconnect_profile,
            get_connection_snapshot,
            set_autostart
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                let state = app_handle.state::<ConnectionManager>();
                state.shutdown();
            }
        });
}
