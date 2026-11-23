import type { FormValues } from './schema';

/** German text lives only in content/de.ts, so a code without its text is a type error. */
export const FIELD_ERROR_CODES = [
  'ROUTE_REQUIRED',
  'CATEGORY_REQUIRED',
  'CATEGORY_UNKNOWN',
  'CATEGORY_UNAVAILABLE',
  'NAME_REQUIRED',
  'NAME_TOO_LONG',
  'EMAIL_REQUIRED',
  'EMAIL_INVALID',
  'EMAIL_TOO_LONG',
  'WEEKLY_TIME_REQUIRED',
  'WEEKLY_TIME_UNKNOWN',
  'ABOUT_TOO_LONG',
  'CONSENT_REQUIRED',
] as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];

export const SUBMIT_ERROR_CODES = ['RATE_LIMITED', 'INTERNAL_ERROR'] as const;

export type SubmitErrorCode = (typeof SUBMIT_ERROR_CODES)[number];

export const DOCUMENT_ERROR_CODES = [
  'DOCUMENT_REQUIRED',
  'DOCUMENT_TYPE_UNSUPPORTED',
  'DOCUMENT_TOO_LARGE',
  'DOCUMENT_LIMIT_REACHED',
] as const;

export type DocumentErrorCode = (typeof DOCUMENT_ERROR_CODES)[number];

export type ErrorCode = FieldErrorCode | SubmitErrorCode | DocumentErrorCode;

/** categoryId maps to route: the form asks one question where the API takes one value. */
const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof FormValues> = {
  categoryId: 'route',
  name: 'name',
  email: 'email',
  weeklyTime: 'weeklyTime',
  about: 'about',
  privacyConsent: 'privacyConsent',
};

export function formFieldFor(serverField: string): keyof FormValues | null {
  return SERVER_FIELD_TO_FORM_FIELD[serverField] ?? null;
}
