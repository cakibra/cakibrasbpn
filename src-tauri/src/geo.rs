use crate::{
    errors::{AppError, AppResult},
    models::GeoLookupResult,
    storage::{load_geo_cache, save_geo_cache, AppPaths},
};
use serde_json::{json, Value};
use std::net::{IpAddr, ToSocketAddrs};

fn resolve_ip(server: &str) -> Option<String> {
    if server.parse::<IpAddr>().is_ok() {
        return Some(server.to_string());
    }
    (server, 0)
        .to_socket_addrs()
        .ok()?
        .find(|addr| addr.is_ipv4())
        .or_else(|| (server, 0).to_socket_addrs().ok()?.next())
        .map(|addr| addr.ip().to_string())
}

pub async fn resolve_geo(paths: &AppPaths, server: &str) -> AppResult<GeoLookupResult> {
    let mut cache = load_geo_cache(paths).unwrap_or_else(|_| Value::Object(Default::default()));
    if let Some(item) = cache.get(server) {
        return Ok(GeoLookupResult {
            server: server.to_string(),
            country_code: item.get("countryCode").and_then(|v| v.as_str()).map(|s| s.to_string()),
            country_name: item.get("countryName").and_then(|v| v.as_str()).map(|s| s.to_string()),
            resolved_ip: item.get("resolvedIp").and_then(|v| v.as_str()).map(|s| s.to_string()),
            error: None,
        });
    }

    let ip = resolve_ip(server).ok_or_else(|| AppError::Message("Unable to resolve IP".to_string()))?;
    let url = format!("https://ipwho.is/{}", ip);
    let response = reqwest::Client::new().get(url).send().await?;
    let payload = response.json::<Value>().await?;
    let country_code = payload.get("country_code").and_then(|v| v.as_str()).map(|s| s.to_string());
    let country_name = payload.get("country").and_then(|v| v.as_str()).map(|s| s.to_string());

    if let Some(obj) = cache.as_object_mut() {
        obj.insert(
            server.to_string(),
            json!({
                "countryCode": country_code,
                "countryName": country_name,
                "resolvedIp": ip
            }),
        );
        let _ = save_geo_cache(paths, &cache);
    }

    Ok(GeoLookupResult {
        server: server.to_string(),
        country_code,
        country_name,
        resolved_ip: Some(ip),
        error: None,
    })
}
