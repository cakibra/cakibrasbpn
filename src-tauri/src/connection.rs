use crate::{
    errors::{AppError, AppResult},
    models::{now_iso, ConnectRequest, RuntimeSnapshot, RuntimeStatus},
    singbox,
    storage::{AppPaths, FileLogger},
    windows_proxy,
};
use std::{
    process::Child,
    sync::{Arc, Mutex},
    thread,
    time::{Duration, Instant},
};

struct RuntimeInner {
    child: Option<Child>,
    snapshot: RuntimeSnapshot,
    last_request: Option<ConnectRequest>,
    next_retry_at: Option<Instant>,
}

impl Default for RuntimeInner {
    fn default() -> Self {
        Self {
            child: None,
            snapshot: RuntimeSnapshot::default(),
            last_request: None,
            next_retry_at: None,
        }
    }
}

struct ConnectionCore {
    inner: Mutex<RuntimeInner>,
    paths: AppPaths,
    logger: FileLogger,
}

#[derive(Clone)]
pub struct ConnectionManager {
    core: Arc<ConnectionCore>,
}

impl ConnectionManager {
    pub fn new(paths: AppPaths, logger: FileLogger) -> Self {
        Self {
            core: Arc::new(ConnectionCore {
                inner: Mutex::new(RuntimeInner::default()),
                paths,
                logger,
            }),
        }
    }

    pub fn start_monitor(&self) {
        let manager = self.clone();
        thread::spawn(move || loop {
            thread::sleep(Duration::from_secs(2));
            let mut reconnect_request = None;

            {
                let mut guard = manager.core.inner.lock().expect("connection mutex");
                if let Some(child) = guard.child.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            manager
                                .core
                                .logger
                                .log(format!("sing-box exited with status {}", status));
                            let auto_reconnect = guard
                                .last_request
                                .as_ref()
                                .map(|request| request.settings.auto_reconnect)
                                .unwrap_or(false);

                            guard.child = None;
                            guard.snapshot.status = RuntimeStatus::Error;
                            guard.snapshot.last_error = Some(format!("Core exited: {}", status));
                            guard.snapshot.pid = None;
                            guard.snapshot.system_proxy_enabled = false;
                            let _ = windows_proxy::disable_system_proxy();

                            if auto_reconnect {
                                guard.next_retry_at = Some(Instant::now() + Duration::from_secs(3));
                            }
                        }
                        Ok(None) => {}
                        Err(error) => {
                            manager.core.logger.log(format!("monitor try_wait error: {}", error));
                        }
                    }
                }

                if guard.child.is_none()
                    && matches!(guard.snapshot.status, RuntimeStatus::Error)
                    && guard
                        .last_request
                        .as_ref()
                        .map(|request| request.settings.auto_reconnect)
                        .unwrap_or(false)
                {
                    let due = guard
                        .next_retry_at
                        .map(|deadline| Instant::now() >= deadline)
                        .unwrap_or(true);
                    if due {
                        reconnect_request = guard.last_request.clone();
                        guard.snapshot.status = RuntimeStatus::Connecting;
                        guard.next_retry_at = Some(Instant::now() + Duration::from_secs(6));
                    }
                }
            }

            if let Some(request) = reconnect_request {
                let _ = manager.connect_internal(request);
            }
        });
    }

    pub fn snapshot(&self) -> RuntimeSnapshot {
        self.core
            .inner
            .lock()
            .expect("connection mutex")
            .snapshot
            .clone()
    }

    pub fn disconnect(&self) -> AppResult<RuntimeSnapshot> {
        let mut guard = self.core.inner.lock().expect("connection mutex");
        guard.snapshot.status = RuntimeStatus::Disconnecting;
        if let Some(mut child) = guard.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        let _ = windows_proxy::disable_system_proxy();
        guard.snapshot = RuntimeSnapshot::default();
        guard.next_retry_at = None;
        self.core.logger.log("Connection stopped");
        Ok(guard.snapshot.clone())
    }

    pub fn shutdown(&self) {
        let _ = self.disconnect();
    }

    pub fn connect_internal(&self, request: ConnectRequest) -> AppResult<RuntimeSnapshot> {
        {
            let mut guard = self.core.inner.lock().expect("connection mutex");
            if let Some(mut child) = guard.child.take() {
                let _ = child.kill();
                let _ = child.wait();
            }

            guard.snapshot.status = RuntimeStatus::Connecting;
            guard.snapshot.active_profile_id = Some(request.profile.id.clone());
            guard.snapshot.active_profile_name = Some(request.profile.name.clone());
            guard.snapshot.protocol = Some(request.profile.protocol.clone());
            guard.snapshot.server = Some(format!("{}:{}", request.profile.server, request.profile.port));
            guard.snapshot.local_proxy_port = Some(request.settings.local_proxy_port);
            guard.snapshot.auto_reconnect = request.settings.auto_reconnect;
            guard.snapshot.last_error = None;
            guard.snapshot.system_proxy_enabled = false;
        }

        singbox::write_runtime_config(&self.core.paths, &request.profile, &request.settings)?;
        singbox::validate_config(&self.core.paths)?;
        let child = singbox::spawn_sidecar(&self.core.paths)?;
        let pid = child.id();
        {
            let mut guard = self.core.inner.lock().expect("connection mutex");
            guard.child = Some(child);
            guard.last_request = Some(request.clone());
            guard.snapshot.pid = Some(pid);
        }

        thread::sleep(Duration::from_millis(700));

        {
            let mut guard = self.core.inner.lock().expect("connection mutex");
            if let Some(child) = guard.child.as_mut() {
                if let Some(status) = child.try_wait()? {
                    guard.child = None;
                    guard.snapshot.status = RuntimeStatus::Error;
                    guard.snapshot.last_error = Some(format!("Core exited during startup: {}", status));
                    self.core.logger.log(format!("Core exited during startup: {}", status));
                    return Err(AppError::Message("sing-box failed to start".to_string()));
                }
            } else {
                return Err(AppError::Message("Core process is missing".to_string()));
            }

            if request.settings.enable_system_proxy {
                windows_proxy::enable_system_proxy(request.settings.local_proxy_port)
                    .map_err(AppError::Message)?;
                guard.snapshot.system_proxy_enabled = true;
            }

            guard.snapshot.status = RuntimeStatus::Connected;
            guard.snapshot.connected_at = Some(now_iso());
            guard.next_retry_at = None;
            self.core.logger.log(format!(
                "Connected {} {}:{}",
                request.profile.protocol, request.profile.server, request.profile.port
            ));
            Ok(guard.snapshot.clone())
        }
    }
}
