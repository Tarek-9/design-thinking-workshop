/** Waits for all four reads, so no screen handles `undefined`; a 403 is left to the sign-in cover. */

import { useQueries } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { isUnauthenticated } from '@/api/problem';
import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { applicationsQuery, stateChangesQuery } from '@/queries/applications';
import { categoriesQuery } from '@/queries/categories';
import { staffMembersQuery } from '@/queries/staffMembers';

type DashboardGateProps = {
  children: ReactNode;
};

export function DashboardGate({ children }: DashboardGateProps) {
  const queries = useQueries({
    queries: [
      applicationsQuery,
      categoriesQuery,
      staffMembersQuery,
      stateChangesQuery,
    ],
  });

  const missing = queries.filter((query) => query.data === undefined);

  if (missing.length === 0) {
    return children;
  }

  const failed = missing.filter(
    (query) => query.isError && !isUnauthenticated(query.error),
  );

  if (failed.length > 0) {
    return (
      <FailurePanel
        onRetry={() => {
          for (const query of failed) {
            void query.refetch();
          }
        }}
      />
    );
  }

  return <LoadingPanel />;
}

/** Plain text: the screen behind it depends on the URL fragment. */
function LoadingPanel() {
  return (
    <p role="status" className="text-tertiary py-12 text-center text-sm">
      {de.dashboard.loading}
    </p>
  );
}

function FailurePanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p role="alert" className="text-secondary text-sm">
        {de.dashboard.loadFailed}
      </p>
      <Button size="sm" color="secondary" onClick={onRetry}>
        {de.dashboard.retry}
      </Button>
    </div>
  );
}
