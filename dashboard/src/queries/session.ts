/**
 * A 403 on boot means nobody is signed in; a 403 later means the Sign-in ran out
 * under someone working, which markSignInExpired turns into the cover.
 */

import type { QueryClient } from '@tanstack/react-query';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { isUnauthenticated } from '@/api/problem';
import type { Credentials } from '@/api/session';
import { fetchSignedInStaffMember, signIn, signOut } from '@/api/session';
import type { SignIn } from '@/domain/signIn';
import { activeSignIn, expireSignIn, NO_SIGN_IN } from '@/domain/signIn';

import { queryKeys } from './keys';

export const signInQuery = queryOptions({
  queryKey: queryKeys.signIn,
  queryFn: async (): Promise<SignIn> => {
    try {
      return activeSignIn(await fetchSignedInStaffMember());
    } catch (failure) {
      if (isUnauthenticated(failure)) {
        return NO_SIGN_IN;
      }
      throw failure;
    }
  },
  /** A 403 is a final answer: retrying would only delay the sign-in screen. */
  retry: false,
});

export function useCurrentSignIn() {
  return useQuery(signInQuery);
}

/**
 * Callers that see a 403 do not know who was signed in, so this takes no Staff
 * member: it only expires the Sign-in the cache holds, and waits for boot.
 */
export function markSignInExpired(queryClient: QueryClient): void {
  queryClient.setQueryData<SignIn>(queryKeys.signIn, (current) =>
    current === undefined ? current : expireSignIn(current),
  );
}

/**
 * Writes the Staff member in directly: the response already is GET /me's answer.
 * Same person from the cover: keep the cache and refetch. Someone else: clear it.
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => signIn(credentials),
    onSuccess: (staffMember) => {
      const previous = queryClient.getQueryData<SignIn>(queryKeys.signIn);
      const wasCovering = previous?.kind === 'expired';
      const resuming =
        wasCovering && previous.staffMember.id === staffMember.id;

      if (wasCovering && !resuming) {
        queryClient.clear();
      }

      queryClient.setQueryData<SignIn>(
        queryKeys.signIn,
        activeSignIn(staffMember),
      );

      if (resuming) {
        void queryClient.invalidateQueries();
      }
    },
  });
}

/**
 * Clears on either outcome: another Staff member on a shared machine must not
 * see the previous list. A 403 burst afterwards is not an expiry: the Sign-in is gone.
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
