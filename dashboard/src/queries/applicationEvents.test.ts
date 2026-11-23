import { describe, expect, it } from 'vitest';

import type { Application } from '@/domain/application';

import {
  applyApplicationEvent,
  parseApplicationEvent,
} from './applicationEvents';

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: 'application-1',
    categoryId: 'social-media',
    name: 'Mara Weber',
    email: 'mara.weber@example.org',
    weeklyTime: 'HOURS_3_5',
    about: null,
    status: 'NEW',
    ownerId: null,
    internalNotes: '',
    discardedAt: null,
    consentAt: '2026-09-01T08:12:44Z',
    consentTextVersion: '2026-09',
    submittedAt: '2026-09-01T08:12:44Z',
    ...overrides,
  };
}

describe('parseApplicationEvent', () => {
  it('decodes the complete Application the event carries', () => {
    const event = parseApplicationEvent(
      'application.created',
      JSON.stringify(application()),
    );

    expect(event).toEqual({
      type: 'application.created',
      application: application(),
    });
  });

  // Throwing would take the stream down, and a refetch repairs a dropped event.
  it('drops a body that is not the JSON it claimed to be', () => {
    expect(parseApplicationEvent('application.updated', 'not json')).toBeNull();
  });
});

describe('applyApplicationEvent', () => {
  const existing = application({ id: 'application-1' });

  it('adds an Application the list has not seen, newest first', () => {
    const created = application({ id: 'application-2', name: 'Ida Lindqvist' });

    expect(
      applyApplicationEvent([existing], {
        type: 'application.created',
        application: created,
      }),
    ).toEqual([created, existing]);
  });

  it('replaces the row an update carries', () => {
    const updated = application({ id: 'application-1', status: 'IN_REVIEW' });

    expect(
      applyApplicationEvent([existing], {
        type: 'application.updated',
        application: updated,
      }),
    ).toEqual([updated]);
  });

  it('removes the row an erase carries', () => {
    expect(
      applyApplicationEvent([existing], {
        type: 'application.deleted',
        application: existing,
      }),
    ).toEqual([]);
  });

  /** Covers a creation the refetch already brought, and an update arriving before any create. */
  it('is idempotent for a creation the list already holds', () => {
    expect(
      applyApplicationEvent([existing], {
        type: 'application.created',
        application: existing,
      }),
    ).toEqual([existing]);
  });

  it('takes in an update for a row the list never had', () => {
    const unseen = application({ id: 'application-9' });

    expect(
      applyApplicationEvent([existing], {
        type: 'application.updated',
        application: unseen,
      }),
    ).toEqual([unseen, existing]);
  });

  it('leaves an erase for a row the list never had alone', () => {
    expect(
      applyApplicationEvent([existing], {
        type: 'application.deleted',
        application: application({ id: 'application-9' }),
      }),
    ).toEqual([existing]);
  });

  it('does not change the list it was given', () => {
    const list = [existing];

    applyApplicationEvent(list, {
      type: 'application.deleted',
      application: existing,
    });

    expect(list).toEqual([existing]);
  });
});
