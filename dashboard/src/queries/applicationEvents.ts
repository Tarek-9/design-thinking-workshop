/**
 * Pure list rules for stream events, so they test without an EventSource.
 * useApplicationStream owns the connection.
 */

import type { ApplicationWire } from '@/api/applications';
import { toApplication } from '@/api/applications';
import type { Application } from '@/domain/application';

export const APPLICATION_EVENT_TYPES = [
  'application.created',
  'application.updated',
  'application.deleted',
] as const;

export type ApplicationEventType = (typeof APPLICATION_EVENT_TYPES)[number];

export type ApplicationEvent = {
  type: ApplicationEventType;
  /** Complete on every type, deleted included, so any screen can drop the row. */
  application: Application;
};

/**
 * A bad body yields null: a refetch repairs a dropped event, and a throw would
 * take the connection down.
 */
export function parseApplicationEvent(
  type: ApplicationEventType,
  data: string,
): ApplicationEvent | null {
  try {
    return {
      type,
      application: toApplication(JSON.parse(data) as ApplicationWire),
    };
  } catch {
    return null;
  }
}

function withoutApplication(
  applications: readonly Application[],
  id: string,
): Application[] {
  return applications.filter((application) => application.id !== id);
}

/**
 * Exported for PATCH responses too: they carry a complete Application and must
 * land in the cache by the same rule.
 */
export function upsertApplication(
  applications: readonly Application[],
  application: Application,
): Application[] {
  const known = applications.some(
    (candidate) => candidate.id === application.id,
  );

  return known
    ? applications.map((candidate) =>
        candidate.id === application.id ? application : candidate,
      )
    : [application, ...applications];
}

/**
 * created and updated share one idempotent upsert: either can arrive for a row
 * the list has or has not seen, so no call site needs a guard.
 */
export function applyApplicationEvent(
  applications: readonly Application[],
  event: ApplicationEvent,
): Application[] {
  const { application } = event;

  return event.type === 'application.deleted'
    ? withoutApplication(applications, application.id)
    : upsertApplication(applications, application);
}
