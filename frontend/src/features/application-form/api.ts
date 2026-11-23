import { getJson, postJson, postMultipart } from '../../lib/http';
import { isUuid } from '../../lib/uuid';
import type { SubmitErrorCode } from './errors';
import type { WeeklyTime } from './routes';
import { CONSENT_TEXT_VERSION } from './routes';
import type { ApplicationValues } from './schema';

/** The whole backend contract lives here: no other module builds a request or reads a response. */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const APPLICATIONS_URL = `${BASE_URL}/api/v1/applications`;
const CATEGORIES_URL = `${BASE_URL}/api/v1/categories`;

const LABEL_MAX = 120;

const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_TOO_LARGE = 413;

/** The backend owns this list, so the frontend only displays it. */
export interface Category {
  id: string;
  label: string;
}

export interface ApplicationRequest {
  submissionId: string;
  categoryId: string;
  name: string;
  email: string;
  weeklyTime: WeeklyTime;
  about?: string;
  privacyConsent: true;
  consentTextVersion: string;
  website: string;
}

export interface ServerFieldError {
  field: string;
  code: string;
}

export type SubmitResult =
  | { status: 'success'; applicationId: string }
  | { status: 'field-errors'; errors: ServerFieldError[] }
  | { status: 'failed'; code: SubmitErrorCode };

export function buildApplicationRequest(
  values: ApplicationValues,
  submissionId: string,
): ApplicationRequest {
  return {
    submissionId,
    categoryId: values.route,
    name: values.name,
    email: values.email,
    weeklyTime: values.weeklyTime,
    // Omitted when empty: the backend then stores null.
    ...(values.about.length > 0 ? { about: values.about } : {}),
    privacyConsent: true,
    consentTextVersion: CONSENT_TEXT_VERSION,
    website: values.website,
  };
}

interface ProblemDetail {
  code?: unknown;
  errors?: unknown;
}

function readFieldErrors(body: unknown): ServerFieldError[] {
  if (typeof body !== 'object' || body === null) return [];
  const { errors } = body as ProblemDetail;
  if (!Array.isArray(errors)) return [];

  return errors.flatMap((entry): ServerFieldError[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { field, code } = entry as Record<string, unknown>;
    if (typeof field !== 'string' || typeof code !== 'string') return [];
    return [{ field, code }];
  });
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readApplicationId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const { applicationId } = body as Record<string, unknown>;
  return typeof applicationId === 'string' && applicationId.length > 0
    ? applicationId
    : null;
}

/** Same submissionId on every retry, so a retry after a dropped connection cannot create a second application. */
export async function submitApplication(
  values: ApplicationValues,
  submissionId: string,
): Promise<SubmitResult> {
  let response: Response;

  try {
    response = await postJson(
      APPLICATIONS_URL,
      buildApplicationRequest(values, submissionId),
    );
  } catch {
    // Network failure or timeout. Retryable, and the entered values are kept.
    return { status: 'failed', code: 'INTERNAL_ERROR' };
  }

  if (response.status === HTTP_CREATED) {
    const applicationId = readApplicationId(await readBody(response));
    if (applicationId !== null) return { status: 'success', applicationId };
    return { status: 'failed', code: 'INTERNAL_ERROR' };
  }

  if (response.status === HTTP_BAD_REQUEST) {
    const errors = readFieldErrors(await readBody(response));
    // A 400 the frontend cannot place under a field would leave the applicant
    // staring at an unchanged form, so it falls back to a general message.
    if (errors.length > 0) return { status: 'field-errors', errors };
    return { status: 'failed', code: 'INTERNAL_ERROR' };
  }

  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return { status: 'failed', code: 'RATE_LIMITED' };
  }

  return { status: 'failed', code: 'INTERNAL_ERROR' };
}

export type UploadResult =
  | { status: 'success' }
  | { status: 'field-errors'; errors: ServerFieldError[] }
  | { status: 'failed' };

/** The backend stores all or none of the files. A proxy 413 also means an oversized file. */
export async function uploadDocuments(
  applicationId: string,
  files: readonly File[],
): Promise<UploadResult> {
  const body = new FormData();
  for (const file of files) {
    body.append('files', file);
  }

  let response: Response;

  try {
    response = await postMultipart(
      `${APPLICATIONS_URL}/${encodeURIComponent(applicationId)}/documents`,
      body,
    );
  } catch {
    return { status: 'failed' };
  }

  if (response.status === HTTP_CREATED) return { status: 'success' };

  if (response.status === HTTP_TOO_LARGE) {
    return {
      status: 'field-errors',
      errors: [{ field: 'files', code: 'DOCUMENT_TOO_LARGE' }],
    };
  }

  if (response.status === HTTP_BAD_REQUEST) {
    const errors = readFieldErrors(await readBody(response));
    if (errors.length > 0) return { status: 'field-errors', errors };
  }

  return { status: 'failed' };
}

export type FetchCategoriesResult =
  { status: 'success'; categories: Category[] } | { status: 'failed' };

/** null means the body breaks the contract. It must fail the load, never become an empty list. */
function readCategories(body: unknown): Category[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const { categories } = body as Record<string, unknown>;
  if (!Array.isArray(categories)) return null;

  const result: Category[] = [];
  const seenIds = new Set<string>();
  for (const entry of categories) {
    if (typeof entry !== 'object' || entry === null) return null;
    const { id, label } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof label !== 'string') return null;
    if (!isUuid(id)) {
      console.warn(`fetchCategories: category id is not a UUID: ${id}`);
      return null;
    }
    const trimmedLabel = label.trim();
    if (trimmedLabel.length === 0 || trimmedLabel.length > LABEL_MAX) {
      console.warn(
        `fetchCategories: category ${id} has an invalid label length: ${String(trimmedLabel.length)}`,
      );
      return null;
    }
    const normalizedId = id.toLowerCase();
    if (seenIds.has(normalizedId)) {
      console.warn(`fetchCategories: duplicate category id: ${id}`);
      return null;
    }
    seenIds.add(normalizedId);
    result.push({ id, label: trimmedLabel });
  }
  return result;
}

/** Every failure returns failed: the caller must offer a retry, never a built-in list. */
export async function fetchCategories(
  signal?: AbortSignal,
): Promise<FetchCategoriesResult> {
  let response: Response;

  try {
    response = await getJson(CATEGORIES_URL, { signal });
  } catch {
    return { status: 'failed' };
  }

  if (!response.ok) return { status: 'failed' };

  const body: unknown = await response.json().catch(() => null);
  const categories = readCategories(body);
  if (categories === null) return { status: 'failed' };
  return { status: 'success', categories };
}
