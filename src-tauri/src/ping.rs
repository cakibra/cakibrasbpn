use crate::models::{now_iso, PingResult, PingTarget};
use std::time::Instant;
use tokio::{net::TcpStream, task::JoinSet, time::{timeout, Duration}};

async fn single_ping(target: PingTarget, timeout_ms: u64) -> PingResult {
    let started = Instant::now();
    let result = timeout(
        Duration::from_millis(timeout_ms),
        TcpStream::connect((target.server.as_str(), target.port)),
    )
    .await;

    match result {
        Ok(Ok(_stream)) => PingResult {
            id: target.id,
            latency_ms: Some(started.elapsed().as_millis()),
            online: true,
            checked_at: now_iso(),
            error: None,
        },
        Ok(Err(error)) => PingResult {
            id: target.id,
            latency_ms: None,
            online: false,
            checked_at: now_iso(),
            error: Some(error.to_string()),
        },
        Err(_) => PingResult {
            id: target.id,
            latency_ms: None,
            online: false,
            checked_at: now_iso(),
            error: Some("timeout".to_string()),
        },
    }
}

pub async fn test_targets(targets: Vec<PingTarget>, timeout_ms: u64) -> Vec<PingResult> {
    let mut set = JoinSet::new();
    for target in targets {
        set.spawn(single_ping(target, timeout_ms));
    }
    let mut results = Vec::new();
    while let Some(result) = set.join_next().await {
        if let Ok(item) = result {
            results.push(item);
        }
    }
    results
}

pub async fn quick_test(target: PingTarget, timeout_ms: u64) -> PingResult {
    single_ping(target, timeout_ms).await
}
