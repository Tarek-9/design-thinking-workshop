/** Each code needs wording, enforced by typecheck. Unknown codes fall back to general. */

/** NOT_DISCARDED is not a field error: nothing in the request is wrong. */
export const TOP_LEVEL_ERROR_CODES = [
  'VALIDATION_FAILED',
  'NOT_DISCARDED',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'CATEGORY_IN_USE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type TopLevelErrorCode = (typeof TOP_LEVEL_ERROR_CODES)[number];

export const FIELD_ERROR_CODES = [
  'STATUS_UNKNOWN',
  'OWNER_UNKNOWN',
  'NOTES_TOO_LONG',
  'CATEGORY_NAME_REQUIRED',
  'CATEGORY_NAME_TOO_LONG',
  'CATEGORY_NAME_TAKEN',
  'CATEGORY_DESCRIPTION_TOO_LONG',
  'ORDER_INCOMPLETE',
  'IMMUTABLE_FIELD',
] as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];
