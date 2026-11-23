/**
 * Reads have no staleTime: the stream refetches them on every open. The erase
 * waits for the server, since it has no undo.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  eraseApplication,
  fetchApplications,
  fetchStateChanges,
  patchApplication,
} from '@/api/applications';
import type { Application, ApplicationEdit } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';

import { upsertApplication } from './applicationEvents';
import { queryKeys } from './keys';
import { optimisticList } from './optimistic';
import { useReportRequestFailure } from './requestFailures';

/** Every Application, discarded ones included; the screens filter for themselves. */
export const applicationsQuery = queryOptions({
  queryKey: queryKeys.applications,
  queryFn: () => fetchApplications(),
});

export const stateChangesQuery = queryOptions({
  queryKey: queryKeys.stateChanges,
  queryFn: () => fetchStateChanges(),
});

const NO_APPLICATIONS: readonly Application[] = [];
const NO_STATE_CHANGES: readonly StateChange[] = [];

/**
 * Unreachable behind DashboardGate. Constants, so renders keep memo identity.
 */
export function useApplications(): readonly Application[] {
  return useQuery(applicationsQuery).data ?? NO_APPLICATIONS;
}

export function useStateChanges(): readonly StateChange[] {
  return useQuery(stateChangesQuery).data ?? NO_STATE_CHANGES;
}

export type ApplicationEditVariables = {
  id: string;
  change: ApplicationEdit;
};

export function useEditApplication() {
  const queryClient = useQueryClient();
  const report = useReportRequestFailure();
  const list = optimisticList<Application>(queryClient, queryKeys.applications);

  return useMutation({
    mutationFn: ({ id, change }: ApplicationEditVariables) =>
      patchApplication(id, change),

    onMutate: ({ id, change }) =>
      list.apply((current) =>
        current.map((application) =>
          application.id === id ? { ...application, ...change } : application,
        ),
      ),

    /** Replaces the row outright: the server may have changed more than was asked. */
    onSuccess: (application) => {
      list.write((current) => upsertApplication(current, application));
    },

    onError: (failure, _variables, context) => {
      list.rollback(context?.snapshot);
      report(failure);
    },
  });
}

/**
 * Discard and restore share one mutation. discardedAt is an argument: the server
 * stamps its own, and the response carries it back.
 */
export type SetDiscardedVariables = {
  ids: ReadonlySet<string>;
  /** An ISO timestamp to discard, null to restore. */
  discardedAt: string | null;
};

export function useSetDiscarded() {
  const queryClient = useQueryClient();
  const report = useReportRequestFailure();
  const list = optimisticList<Application>(queryClient, queryKeys.applications);

  return useMutation({
    mutationFn: ({ ids, discardedAt }: SetDiscardedVariables) =>
      allOrThrow(
        [...ids].map((id) =>
          patchApplication(id, { discarded: discardedAt !== null }),
        ),
      ),

    onMutate: ({ ids, discardedAt }) =>
      list.apply((current) =>
        current.map((application) =>
          ids.has(application.id)
            ? { ...application, discardedAt }
            : application,
        ),
      ),

    onSuccess: (applications) => {
      list.write((current) =>
        applications.reduce<Application[]>(
          (rows, application) => upsertApplication(rows, application),
          [...current],
        ),
      );
    },

    onError: (failure, _variables, context) => {
      list.rollback(context?.snapshot);
      report(failure);
    },
  });
}

/**
 * The only path that deletes what a person wrote, so it awaits the server. The
 * State changes go with it, so their cache is refetched too.
 */
export function useEraseApplications() {
  const queryClient = useQueryClient();
  const report = useReportRequestFailure();
  const list = optimisticList<Application>(queryClient, queryKeys.applications);

  return useMutation({
    mutationFn: (ids: ReadonlySet<string>) =>
      allOrThrow([...ids].map((id) => eraseApplication(id))),

    onSuccess: (_erased, ids) => {
      list.write((current) =>
        current.filter((application) => !ids.has(application.id)),
      );
    },

    onError: (failure) => {
      report(failure);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications,
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.stateChanges });
    },
  });
}

/**
 * Waits for every request before failing, so the successful ones keep their
 * effect and the refetch after a failure shows which landed.
 */
async function allOrThrow<T>(requests: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(requests);
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failed !== undefined) {
    throw failed.reason;
  }

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
}
