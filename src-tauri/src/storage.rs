use crate::errors::{AppError, AppResult};
use serde_json::Value;
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri::{path::BaseDirectory, AppHandle, Manager};

#[derive(Debug, Clone)]
pub struct AppPaths {
    pub root_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub runtime_dir: PathBuf,
    pub state_file: PathBuf,
    pub geo_cache_file: PathBuf,
    pub sidecar_path: PathBuf,
    pub current_config_path: PathBuf,
}

impl AppPaths {
    pub fn resolve(app: &AppHandle) -> AppResult<Self> {
        let root_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Message(e.to_string()))?;
        let logs_dir = root_dir.join("logs");
        let runtime_dir = root_dir.join("runtime");
        fs::create_dir_all(&logs_dir)?;
        fs::create_dir_all(&runtime_dir)?;

        let candidate_paths: Vec<PathBuf> = vec![
            app.path().resolve("resources/bin/sing-box.exe", BaseDirectory::Resource).ok(),
            app.path().resolve("bin/sing-box.exe", BaseDirectory::Resource).ok(),
            Some(std::env::current_dir().unwrap_or_default().join("src-tauri/resources/bin/sing-box.exe")),
            Some(std::env::current_dir().unwrap_or_default().join("resources/bin/sing-box.exe")),
        ]
        .into_iter()
        .flatten()
        .collect();

        let sidecar_path = candidate_paths
            .into_iter()
            .find(|path| path.exists())
            .ok_or_else(|| AppError::Message("sing-box.exe not found. Run build.bat first.".to_string()))?;

        Ok(Self {
            root_dir: root_dir.clone(),
            logs_dir,
            runtime_dir: runtime_dir.clone(),
            state_file: root_dir.join("state.json"),
            geo_cache_file: root_dir.join("geo-cache.json"),
            sidecar_path,
            current_config_path: runtime_dir.join("active-config.json"),
        })
    }
}

#[derive(Clone)]
pub struct FileLogger {
    file: Arc<Mutex<File>>,
}

impl FileLogger {
    pub fn new(paths: &AppPaths) -> AppResult<Self> {
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(paths.logs_dir.join("app.log"))?;
        Ok(Self {
            file: Arc::new(Mutex::new(file)),
        })
    }

    pub fn log(&self, message: impl AsRef<str>) {
        let timestamp = chrono::Utc::now().to_rfc3339();
        if let Ok(mut file) = self.file.lock() {
            let _ = writeln!(file, "[{}] {}", timestamp, message.as_ref());
        }
    }
}

pub fn load_state(paths: &AppPaths) -> AppResult<Option<Value>> {
    if !paths.state_file.exists() {
        return Ok(None);
    }
    let contents = fs::read_to_string(&paths.state_file)?;
    let value = serde_json::from_str::<Value>(&contents)?;
    Ok(Some(value))
}

pub fn save_state(paths: &AppPaths, value: &Value) -> AppResult<()> {
    fs::write(&paths.state_file, serde_json::to_vec_pretty(value)?)?;
    Ok(())
}

pub fn load_geo_cache(paths: &AppPaths) -> AppResult<Value> {
    if !paths.geo_cache_file.exists() {
        return Ok(Value::Object(Default::default()));
    }
    let contents = fs::read_to_string(&paths.geo_cache_file)?;
    Ok(serde_json::from_str::<Value>(&contents)?)
}

pub fn save_geo_cache(paths: &AppPaths, value: &Value) -> AppResult<()> {
    fs::write(&paths.geo_cache_file, serde_json::to_vec_pretty(value)?)?;
    Ok(())
}
