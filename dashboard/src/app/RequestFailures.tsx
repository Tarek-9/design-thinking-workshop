/** One notice for failed writes and stale lists; it stays until dismissed, so it cannot vanish mid-read. */

import { useQueries } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { isUnauthenticated, problemCode } from '@/api/problem';
import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { errorMessage } from '@/content/errorMessage';
import { applicationsQuery, stateChangesQuery } from '@/queries/applications';
import { categoriesQuery } from '@/queries/categories';
import type { RequestFailures as RequestFailuresValue } from '@/queries/requestFailures';
import {
  RequestFailuresContext,
  useRequestFailures,
} from '@/queries/requestFailures';
import { staffMembersQuery } from '@/queries/staffMembers';
import { cx } from '@/utils/cx';

import { DRAWER_RESERVE } from './strip';

/** Unauthenticated errors are left to the sign-in screen, not shown here. */
export function RequestFailureNotice() {
  const { write, dismissedAt, dismiss } = useRequestFailures();

  const queries = useQueries({
    queries: [
      applicationsQuery,
      categoriesQuery,
      staffMembersQuery,
      stateChangesQuery,
    ],
  });

  // Without data there is nothing to leave stale: DashboardGate's panel covers it.
  const stale = queries.filter(
    (query) =>
      query.data !== undefined &&
      query.isError &&
      !isUnauthenticated(query.error) &&
      query.errorUpdatedAt > dismissedAt,
  );

  const staleAt = Math.max(0, ...stale.map((query) => query.errorUpdatedAt));
  const failedWrite = write !== null && write.at > dismissedAt ? write : null;

  if (failedWrite !== null && failedWrite.at >= staleAt) {
    return (
      <Notice onDismiss={dismiss}>
        {errorMessage(problemCode(failedWrite.failure))}
      </Notice>
    );
  }

  if (stale.length > 0) {
    return (
      <Notice
        onDismiss={dismiss}
        onRetry={() => {
          for (const query of stale) {
            void query.refetch();
          }
        }}
      >
        {de.dashboard.updateFailed}
      </Notice>
    );
  }

  return null;
}

/** Sentence above buttons, so the drawer never cuts a word or a button. */
function Notice({
  children,
  onRetry,
  onDismiss,
}: {
  children: ReactNode;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border-utility-red-200 bg-bg-error-primary rounded-lg border px-3.5 py-3">
      <div className={cx('flex flex-col items-start gap-2', DRAWER_RESERVE)}>
        <p role="alert" className="text-text-error-primary text-sm">
          {children}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {onRetry !== undefined && (
            <Button size="sm" color="secondary" onClick={onRetry}>
              {de.dashboard.retry}
            </Button>
          )}

          <Button size="sm" color="tertiary" onClick={onDismiss}>
            {de.dashboard.dismissFailure}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Holds the last failed write; one slot, so five failed discards show one sentence. */
export function RequestFailures({ children }: { children: ReactNode }) {
  const [write, setWrite] = useState<RequestFailuresValue['write']>(null);
  const [dismissedAt, setDismissedAt] = useState(0);

  const report = useCallback((raised: unknown) => {
    if (isUnauthenticated(raised)) {
      return;
    }

    setWrite({ failure: raised, at: Date.now() });
  }, []);

  // Queries keep their error until a success, so the stale list is hidden here.
  const dismiss = useCallback(() => {
    setWrite(null);
    setDismissedAt(Date.now());
  }, []);

  const value = useMemo<RequestFailuresValue>(
    () => ({ write, dismissedAt, report, dismiss }),
    [write, dismissedAt, report, dismiss],
  );

  return (
    <RequestFailuresContext.Provider value={value}>
      {children}
    </RequestFailuresContext.Provider>
  );
}
