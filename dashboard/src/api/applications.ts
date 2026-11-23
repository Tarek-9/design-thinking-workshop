/** Whole-list reads: the server does no filtering, sorting or paging. */

import type { Application, ApplicationPatch } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';
import { STATE_CHANGE_WINDOW_DAYS } from '@/domain/stateChange';

import { request, requestNoContent } from './transport';

/** Enums are not validated: one unknown status must not blank the whole list. */
export type ApplicationWire = {
  id: string;
  categoryId: string;
  name: string;
  email: string;
  weeklyTime: Application['weeklyTime'];
  about: string | null;
  status: Application['status'];
  ownerId: string | null;
  internalNotes: string;
  discardedAt: string | null;
  consentAt: string;
  consentTextVersion: string;
  submittedAt: string;
};

export function toApplication(wire: ApplicationWire): Application {
  return {
    id: wire.id,
    categoryId: wire.categoryId,
    name: wire.name,
    email: wire.email,
    weeklyTime: wire.weeklyTime,
    about: wire.about,
    status: wire.status,
    ownerId: wire.ownerId,
    internalNotes: wire.internalNotes,
    discardedAt: wire.discardedAt,
    consentAt: wire.consentAt,
    consentTextVersion: wire.consentTextVersion,
    submittedAt: wire.submittedAt,
  };
}

export async function fetchApplications(): Promise<Application[]> {
  const { applications } = await request<{
    applications: ApplicationWire[];
  }>('GET', '/applications');

  return applications.map(toApplication);
}

type StateChangeWire = {
  applicationId: string;
  at: string;
  field: StateChange['field'];
  to: string | boolean | null;
};

export async function fetchStateChanges(
  days: number = STATE_CHANGE_WINDOW_DAYS,
): Promise<StateChange[]> {
  const { changes } = await request<{ changes: StateChangeWire[] }>(
    'GET',
    `/applications/changes?days=${String(days)}`,
  );

  return changes.map((change) => ({
    applicationId: change.applicationId,
    at: change.at,
    field: change.field,
    to: change.to,
  }));
}

/** An absent `ownerId` and an explicit `null` differ, so the body goes out as built. */
export async function patchApplication(
  id: string,
  patch: ApplicationPatch,
): Promise<Application> {
  return toApplication(
    await request<ApplicationWire>(
      'PATCH',
      `/applications/${encodeURIComponent(id)}`,
      patch,
    ),
  );
}

/** Only a discarded Application can be erased: the backend answers `400 NOT_DISCARDED` otherwise. */
export async function eraseApplication(id: string): Promise<void> {
  await requestNoContent(
    'DELETE',
    `/applications/${encodeURIComponent(id)}/permanently`,
  );
}
