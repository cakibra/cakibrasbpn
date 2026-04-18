use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscriptionRequest {
    pub url: String,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
    pub timeout_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscriptionFetchResponse {
    pub status_code: u16,
    pub final_url: Option<String>,
    pub content: Option<String>,
    pub not_modified: bool,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingTarget {
    pub id: String,
    pub server: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResult {
    pub id: String,
    pub latency_ms: Option<u128>,
    pub online: bool,
    pub checked_at: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeoLookupResult {
    pub server: String,
    pub country_code: Option<String>,
    pub country_name: Option<String>,
    pub resolved_ip: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RouteRule {
    pub id: String,
    pub label: String,
    pub mode: String,
    pub domains: Vec<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSettings {
    pub local_proxy_port: u16,
    pub enable_system_proxy: bool,
    pub auto_reconnect: bool,
    pub routing_mode: Option<String>,
    pub tun_enabled: Option<bool>,
    pub route_rules: Option<Vec<RouteRule>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub server: String,
    pub port: u16,
    #[serde(rename = "sourceType")]
    pub source_type: String,
    pub subscription_id: Option<String>,
    pub source_label: String,
    pub favorite: bool,
    pub details: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectRequest {
    pub profile: ConnectionProfile,
    pub settings: RuntimeSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeStatus {
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSnapshot {
    pub status: RuntimeStatus,
    pub active_profile_id: Option<String>,
    pub active_profile_name: Option<String>,
    pub protocol: Option<String>,
    pub server: Option<String>,
    pub local_proxy_port: Option<u16>,
    pub pid: Option<u32>,
    pub connected_at: Option<String>,
    pub last_error: Option<String>,
    pub auto_reconnect: bool,
    pub system_proxy_enabled: bool,
}

impl Default for RuntimeSnapshot {
    fn default() -> Self {
        Self {
            status: RuntimeStatus::Disconnected,
            active_profile_id: None,
            active_profile_name: None,
            protocol: None,
            server: None,
            local_proxy_port: None,
            pid: None,
            connected_at: None,
            last_error: None,
            auto_reconnect: false,
            system_proxy_enabled: false,
        }
    }
}

pub fn now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    chrono_like(now.as_secs())
}

fn chrono_like(epoch_seconds: u64) -> String {
    let datetime = time_string(epoch_seconds);
    datetime
}

fn time_string(epoch_seconds: u64) -> String {
    use std::time::{Duration, UNIX_EPOCH};
    let st = UNIX_EPOCH + Duration::from_secs(epoch_seconds);
    let datetime: chrono::DateTime<chrono::Utc> = st.into();
    datetime.to_rfc3339()
}
