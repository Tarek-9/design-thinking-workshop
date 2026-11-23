import type { Application } from '@/domain/application';
import { APPLICATION_STATUSES } from '@/domain/application';
import type { StateChange, StateChangeField } from '@/domain/stateChange';

type ChangesByField = ReadonlyMap<StateChangeField, readonly StateChange[]>;

// Grouped per call: a cache keyed on two arrays would cost more than it saves.
function groupByApplication(
  stateChanges: readonly StateChange[],
): ReadonlyMap<string, ChangesByField> {
  const byApplication = new Map<string, Map<StateChangeField, StateChange[]>>();

  const ordered = [...stateChanges].sort((a, b) => (a.at < b.at ? -1 : 1));

  for (const change of ordered) {
    const byField =
      byApplication.get(change.applicationId) ??
      new Map<StateChangeField, StateChange[]>();
    byField.set(change.field, [...(byField.get(change.field) ?? []), change]);
    byApplication.set(change.applicationId, byField);
  }

  return byApplication;
}

function valueAt(
  changes: readonly StateChange[] | undefined,
  asOf: Date,
): { changedAfter: boolean; last: StateChange | undefined } {
  if (changes === undefined || changes.length === 0) {
    return { changedAfter: false, last: undefined };
  }

  const cutoff = asOf.getTime();
  const upTo = changes.filter(
    (change) => new Date(change.at).getTime() <= cutoff,
  );

  return {
    changedAfter: upTo.length < changes.length,
    last: upTo.at(-1),
  };
}

function isStatus(value: unknown): value is Application['status'] {
  return (
    typeof value === 'string' &&
    (APPLICATION_STATUSES as readonly string[]).includes(value)
  );
}

function applicationAsOf(
  application: Application,
  changes: ChangesByField | undefined,
  asOf: Date,
): Application {
  const status = valueAt(changes?.get('STATUS'), asOf);
  const owner = valueAt(changes?.get('OWNER'), asOf);
  const discarded = valueAt(changes?.get('DISCARDED'), asOf);

  // Without a later row the current status still holds; NEW is the submitted one.
  const statusThen = !status.changedAfter
    ? application.status
    : isStatus(status.last?.to)
      ? status.last.to
      : 'NEW';

  // A null "to" means the Owner was cleared.
  const ownerIdThen = !owner.changedAfter
    ? application.ownerId
    : typeof owner.last?.to === 'string'
      ? owner.last.to
      : null;

  // The wire sends DISCARDED as a boolean, so a true is dated by the row that set it.
  const discardedAtThen = !discarded.changedAfter
    ? application.discardedAt
    : discarded.last !== undefined && discarded.last.to === true
      ? discarded.last.at
      : null;

  return {
    ...application,
    status: statusThen,
    ownerId: ownerIdThen,
    discardedAt: discardedAtThen,
  };
}

// Walks backwards from the current values: the history covers only the last
// STATE_CHANGE_WINDOW_DAYS, so a forwards replay would misread older fields.
export function applicationsAsOf(
  applications: readonly Application[],
  stateChanges: readonly StateChange[],
  asOf: Date,
): Application[] {
  const byApplication = groupByApplication(stateChanges);
  const cutoff = asOf.getTime();

  return applications
    .filter(
      (application) => new Date(application.submittedAt).getTime() <= cutoff,
    )
    .map((application) =>
      applicationAsOf(application, byApplication.get(application.id), asOf),
    );
}
