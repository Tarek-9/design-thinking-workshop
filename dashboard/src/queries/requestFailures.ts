/**
 * The one place a failed request is remembered, so it is worded once.
 * Kept as thrown, so the notice can read its code.
 */

import { createContext, useContext } from 'react';

export type ReportedFailure = {
  failure: unknown;
  /** Compared with the refetch's errorUpdatedAt: the newer one wins, one notice per cause. */
  at: number;
};

export type RequestFailures = {
  write: ReportedFailure | null;
  /** Hides older failures by time, since a failed query keeps its error. */
  dismissedAt: number;
  report: (failure: unknown) => void;
  dismiss: () => void;
};

/** Defaults to no-op: outside the dashboard (the sign-in screen) there is nothing to report to. */
export const RequestFailuresContext = createContext<RequestFailures>({
  write: null,
  dismissedAt: 0,
  report: () => undefined,
  dismiss: () => undefined,
});

export function useReportRequestFailure(): (failure: unknown) => void {
  return useContext(RequestFailuresContext).report;
}

export function useRequestFailures(): Omit<RequestFailures, 'report'> {
  const { write, dismissedAt, dismiss } = useContext(RequestFailuresContext);
  return { write, dismissedAt, dismiss };
}
