export const DEFAULT_TIMEOUT_MS = 15_000;

export const UPLOAD_TIMEOUT_MS = 60_000;

interface PostJsonOptions {
  timeoutMs?: number;
  keepalive?: boolean;
}

export function postJson(
  url: string,
  body: unknown,
  { timeoutMs = DEFAULT_TIMEOUT_MS, keepalive }: PostJsonOptions = {},
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    keepalive,
  });
}

/** No Content-Type header, so the browser can write the multipart boundary. */
export function postMultipart(
  url: string,
  body: FormData,
  { timeoutMs = UPLOAD_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

interface GetJsonOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export function getJson(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal }: GetJsonOptions = {},
): Promise<Response> {
  return fetch(url, {
    headers: { Accept: 'application/json' },
    signal: signal
      ? AbortSignal.any([AbortSignal.timeout(timeoutMs), signal])
      : AbortSignal.timeout(timeoutMs),
  });
}
