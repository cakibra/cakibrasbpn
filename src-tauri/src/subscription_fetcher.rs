use crate::{
    errors::AppResult,
    models::{SubscriptionFetchResponse, SubscriptionRequest},
};

pub async fn download_subscription(request: SubscriptionRequest) -> AppResult<SubscriptionFetchResponse> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(5))
        .timeout(std::time::Duration::from_millis(request.timeout_ms))
        .build()?;

    let mut builder = client.get(&request.url);
    if let Some(etag) = &request.etag {
        builder = builder.header(reqwest::header::IF_NONE_MATCH, etag);
    }
    if let Some(last_modified) = &request.last_modified {
        builder = builder.header(reqwest::header::IF_MODIFIED_SINCE, last_modified);
    }

    let response = builder.send().await?;
    let status_code = response.status().as_u16();
    let final_url = Some(response.url().to_string());
    let etag = response
        .headers()
        .get(reqwest::header::ETAG)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let last_modified = response
        .headers()
        .get(reqwest::header::LAST_MODIFIED)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if status_code == 304 {
        return Ok(SubscriptionFetchResponse {
            status_code,
            final_url,
            content: None,
            not_modified: true,
            etag,
            last_modified,
            error: None,
        });
    }

    let content = response.text().await?;
    Ok(SubscriptionFetchResponse {
        status_code,
        final_url,
        content: Some(content),
        not_modified: false,
        etag,
        last_modified,
        error: None,
    })
}
