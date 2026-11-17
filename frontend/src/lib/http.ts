/** Requests time out after this long by default; pass `timeoutMs` to override. */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Up to three files of 5 MB each (`API.md`, documents). */
export const UPLOAD_TIMEOUT_MS = 60_000;

interface PostJsonOptions {
  timeoutMs?: number;
  keepalive?: boolean;
}

/** POSTs a JSON body with the headers and timeout every endpoint needs. */
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

/**
 * POSTs multipart form data; no `Content-Type`, so the browser writes the
 * boundary. Uploads get a longer timeout than JSON.
 */
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

/** GETs a resource with the timeout every endpoint needs. */
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
