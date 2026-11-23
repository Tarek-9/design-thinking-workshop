/** Identifiers and enum values are English; German wording lives in content/de.ts. */

/** `categorised` is not a status. */
export const APPLICATION_STATUSES = [
  'NEW',
  'IN_REVIEW',
  'INTRO_BOOKED',
  'ACTIVE',
  'WAITLISTED',
  'DECLINED',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Bands: IRREGULAR is no quantity, so hours cannot express it. */
export const WEEKLY_TIMES = [
  'HOURS_1_2',
  'HOURS_3_5',
  'HOURS_5_PLUS',
  'IRREGULAR',
] as const;

export type WeeklyTime = (typeof WEEKLY_TIMES)[number];

/** Done one way or the other. Every other status counts as open. */
export const COMPLETED_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'ACTIVE',
  'DECLINED',
];

/** Re-exported: every Application-facing component reads it from here. */
export type { Category } from './category';

/** Name and id only: no address, so personal data stays off the selector. */
export type Owner = {
  id: string;
  name: string;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  submittedAt: string;
  categoryId: string;
  weeklyTime: WeeklyTime;
  status: ApplicationStatus;
  ownerId: string | null;
  /** Null when nothing was written: the backend stores empty text as no text. */
  about: string | null;
  /** Never null on the wire: the backend turns a stored null into "". */
  internalNotes: string;
  /** Null while in the working list. Discarded is not a Status. */
  discardedAt: string | null;
  consentAt: string;
  /** Which consent wording they agreed to, e.g. `2026-09`. */
  consentTextVersion: string;
};

/** The three fields a Staff member may change. The rest is server-owned. */
export type ApplicationEdit = Partial<
  Pick<Application, 'status' | 'ownerId' | 'internalNotes'>
>;

/** No Owner yet: the row stays emphasised until one is assigned. */
export function isUnassigned(
  application: Pick<Application, 'ownerId'>,
): boolean {
  return application.ownerId === null;
}

/** Out of the working list but kept, shown only on the fourth screen. */
export function isDiscarded(
  application: Pick<Application, 'discardedAt'>,
): boolean {
  return application.discardedAt !== null;
}

/** One function for both directions: discarding and restoring are one field. */
export function setDiscarded(
  applications: readonly Application[],
  ids: ReadonlySet<string>,
  discardedAt: string | null,
): Application[] {
  return applications.map((application) =>
    ids.has(application.id) ? { ...application, discardedAt } : application,
  );
}

/** The backend's NOTES_TOO_LONG limit, and the textarea cap. */
export const INTERNAL_NOTES_MAX_LENGTH = 4000;

/** A request per keystroke would look like a flood to the server. */
export const NOTES_DEBOUNCE_MS = 800;

export const APPLICATION_VIEWS = ['all', 'unassigned', 'stale'] as const;

export type ApplicationView = (typeof APPLICATION_VIEWS)[number];

/** The German label of the "stale" view is built from this number. */
export const STALE_AFTER_DAYS = 7;

/** Absent keys are left alone and `ownerId: null` clears the Owner, so never spread an Application. */
export type ApplicationPatch = ApplicationEdit & { discarded?: boolean };
