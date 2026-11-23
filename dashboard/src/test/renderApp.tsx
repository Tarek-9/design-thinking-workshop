import type { QueryClient } from '@tanstack/react-query';
import type { RenderResult } from '@testing-library/react';
import { render, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

import { App } from '@/app/App';
import { de } from '@/content/de';
import { createQueryClient } from '@/queries/queryClient';

import { REFERENCE_DATE } from './stubApi';

// Retries would make a failing test slow, and a cache that outlives the
// render would carry one test's lists into the next.
export function testQueryClient(): QueryClient {
  const client = createQueryClient();

  client.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  });

  return client;
}

export function renderApp(): RenderResult {
  return render(<App now={REFERENCE_DATE} client={testQueryClient()} />);
}

// Screen tests start signed in, so they skip the sign-in form.
export async function renderSignedIn(): Promise<RenderResult> {
  const result = renderApp();

  await waitFor(() => {
    expect(
      result.getByRole('navigation', { name: de.navigation.label }),
    ).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(result.queryByText(de.dashboard.loading)).not.toBeInTheDocument();
  });

  return result;
}
