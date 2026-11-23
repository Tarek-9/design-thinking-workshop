/** Same origin, because the cookie is SameSite=Strict; no-store, because the lists are personal data. */

import type { ApiFieldProblem } from './problem';
import { ApiProblem } from './problem';

export const STAFF_API = '/api/v1/staff';

const HTTP_NO_CONTENT = 204;

/** Only `code` and `errors` are read: the dashboard words the code itself. */
type ProblemBody = {
  code?: unknown;
  errors?: unknown;
};

function fieldProblemsIn(body: ProblemBody): ApiFieldProblem[] {
  if (!Array.isArray(body.errors)) {
    return [];
  }

  return body.errors.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const { field, code } = entry as { field?: unknown; code?: unknown };
    return typeof field === 'string' && typeof code === 'string'
      ? [{ field, code }]
      : [];
  });
}

/** A body that is not JSON leaves only the status, so the screen still shows a failure. */
async function problemFrom(response: Response): Promise<ApiProblem> {
  let body: ProblemBody = {};

  try {
    body = (await response.json()) as ProblemBody;
  } catch {
    body = {};
  }

  const retryAfter = Number(response.headers.get('Retry-After'));

  return new ApiProblem({
    status: response.status,
    code: typeof body.code === 'string' ? body.code : undefined,
    errors: fieldProblemsIn(body),
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
  });
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${STAFF_API}${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw await problemFrom(response);
  }

  if (response.status === HTTP_NO_CONTENT) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function requestNoContent(
  method: Method,
  path: string,
  body?: unknown,
): Promise<void> {
  await request<null>(method, path, body);
}
