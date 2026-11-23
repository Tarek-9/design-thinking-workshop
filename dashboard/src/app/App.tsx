import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { de } from '@/content/de';
import { NO_SIGN_IN } from '@/domain/signIn';
import type { StaffMember } from '@/domain/staffMember';
import { ApplicationsContainer } from '@/features/applications/ApplicationsContainer';
import { parseFiltersFromHash } from '@/features/applications/filterApplications';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { CategoriesContainer } from '@/features/categories/CategoriesContainer';
import { DiscardedContainer } from '@/features/discarded/DiscardedContainer';
import { OverviewContainer } from '@/features/overview/OverviewContainer';
import { createQueryClient } from '@/queries/queryClient';
import { useCurrentSignIn, useSignIn, useSignOut } from '@/queries/session';

import type { Screen } from './AppShell';
import { AppShell } from './AppShell';
import { DashboardGate } from './DashboardGate';
import { RequestFailures } from './RequestFailures';
import { SignInCover } from './SignInCover';
import { useCurrentScreen } from './useCurrentScreen';

type AppProps = {
  /** Fixed in tests so the fixtures agree on one reference date. */
  now?: Date;
  /** Tests pass their own client; a client rebuilt on render would drop the list. */
  client?: QueryClient;
};

export function App({ now, client }: AppProps = {}) {
  const [queryClient] = useState(() => client ?? createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard now={now} />
    </QueryClientProvider>
  );
}

/** An expired Sign-in keeps the shell mounted under `SignInCover`, so open work survives. */
function Dashboard({ now }: { now?: Date }) {
  const current = useCurrentScreen();
  const referenceDate = useMemo(() => now ?? new Date(), [now]);

  const query = useCurrentSignIn();
  const signInRequest = useSignIn();
  const signOutRequest = useSignOut();

  if (query.isPending) {
    return (
      <main className="bg-primary text-primary flex min-h-dvh items-center justify-center">
        <p role="status" className="text-tertiary text-sm">
          {de.auth.checking}
        </p>
      </main>
    );
  }

  const signIn = query.data ?? NO_SIGN_IN;

  if (signIn.kind === 'none') {
    return (
      <LoginScreen
        onSignIn={signInRequest.mutate}
        /* Other GET /me failures land here too: signing in is the only way out. */
        failure={signInRequest.error ?? query.error}
        isSubmitting={signInRequest.isPending}
      />
    );
  }

  const expired = signIn.kind === 'expired';
  const staffMember: StaffMember = signIn.staffMember;

  return (
    <RequestFailures>
      <AppShell
        current={current}
        account={staffMember}
        signInExpired={expired}
        onSignOut={() => {
          signOutRequest.mutate();
        }}
      >
        <DashboardGate>
          <Screens
            current={current}
            staffMember={staffMember}
            now={referenceDate}
          />
        </DashboardGate>
      </AppShell>

      {expired && (
        <SignInCover
          staffMember={staffMember}
          onSignIn={signInRequest.mutate}
          failure={signInRequest.error}
          isSubmitting={signInRequest.isPending}
        />
      )}
    </RequestFailures>
  );
}

/** Mounted only while signed in: the sign-in screen would fire four requests that can only answer 403. */
function Screens({
  current,
  staffMember,
  now,
}: {
  current: Screen;
  staffMember: StaffMember;
  now: Date;
}) {
  return (
    <>
      {current === 'overview' && (
        <OverviewContainer staffName={staffMember.name} now={now} />
      )}

      {current === 'applications' && (
        <ApplicationsContainer
          now={now}
          initialFilters={parseFiltersFromHash(window.location.hash)}
        />
      )}

      {current === 'categories' && <CategoriesContainer />}

      {current === 'discarded' && <DiscardedContainer now={now} />}
    </>
  );
}
