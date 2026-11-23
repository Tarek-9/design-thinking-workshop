/**
 * No timers and no focus refetch: the stream applies changes, and a refetch could
 * overwrite an optimistic write it has not yet echoed. Retries never repeat a 401.
 */

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isUnauthenticated } from '@/api/problem';

import { markSignInExpired } from './session';

export function createQueryClient(): QueryClient {
  /** Both callbacks close over the client, which only exists once the caches do. */
  function onError(failure: unknown): void {
    if (isUnauthenticated(failure)) {
      markSignInExpired(client);
    }
  }

  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: (attempts, failure) =>
          !isUnauthenticated(failure) && attempts < 1,
      },
    },
  });

  return client;
}
